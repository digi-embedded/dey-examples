/*
 * Copyright 2017, Digi International Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
 * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

#include <errno.h>
#include <libgen.h>
#include <limits.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <time.h>

#include <libdigiapix/spi.h>

#define DEFAULT_SPI_ALIAS		"DEFAULT_SPI"
#define DEFAULT_SPI_ADDRESS_SIZE	1
#define DEFAULT_SPI_PAGE_SIZE		16
#define DEFAULT_SPI_PAGE_INDEX		0

#define ARG_SPI_DEVICE		0
#define ARG_SPI_SLAVE		1

#define BUFF_SIZE			256

#define WREN				0x06
#define WRDI				0x04
#define WRITE				0x02
#define READ				0x03
#define RDSR				0x05

#define CLK_MODE			SPI_CLK_MODE_0
#define CHIP_SELECT			SPI_CS_ACTIVE_LOW
#define BIT_ORDER			SPI_BO_MSB_FIRST
#define MAX_BUS_SPEED		1000000 /* 1MHz */
#define BITS_PER_WORD		SPI_BPW_8

#define OPERATION_BYTES		1

static spi_t *spi_dev;
static unsigned int page_size, address_bytes = 0;
static uint8_t *tx_buffer;
static uint8_t *rx_buffer;

/*
 * usage_and_exit() - Show usage information and exit with 'exitval' return
 *					  value
 *
 * @name:	Application name.
 * @exitval:	The exit code.
 */
static void usage_and_exit(char *name, int exitval)
{
	fprintf(stdout,
		"Example application using libdigiapix SPI support\n"
		"\n"
		"Usage: %s <spi-dev> <spi-ss> <address-size> <page-size> <page-index>\n\n"
		"<spi-dev>       SPI device index to use or alias\n"
		"<spi-ss>        SPI slave index to use or alias\n"
		"<address-size>  Number of EEPROM memory address bytes\n"
		"<page-size>     EEPROM memory page size in bytes\n"
		"<page-index>    EEPROM memory page index to use\n"
		"\n"
		"Aliases for SPI can be configured in the library config file\n"
		"\n", name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	/* Free spi */
	ldx_spi_free(spi_dev);

	/* Free buffers */
	free(tx_buffer);
	free(rx_buffer);
}

/*
 * sigaction_handler() - Handler to execute after receiving a signal
 *
 * @signum:	Received signal.
 */
static void sigaction_handler(int signum)
{
	/* 'atexit' executes the cleanup function */
	exit(EXIT_FAILURE);
}

/*
 * register_signals() - Registers program signals
 */
static void register_signals(void)
{
	struct sigaction action;

	action.sa_handler = sigaction_handler;
	action.sa_flags = 0;
	sigemptyset(&action.sa_mask);

	sigaction(SIGHUP, &action, NULL);
	sigaction(SIGINT, &action, NULL);
	sigaction(SIGTERM, &action, NULL);
}

/*
 * parse_argument() - Parses the given string argument and returns the
 *					  corresponding integer value
 *
 * @argv:	Argument to parse in string format.
 * @arg_type:	Type of the argument to parse.
 *
 * Return: The parsed integer argument, -1 on error.
 */
static int parse_argument(char *argv, int arg_type)
{
	char *endptr;
	long value;

	errno = 0;
	value = strtol(argv, &endptr, 10);

	if ((errno == ERANGE && (value == LONG_MAX || value == LONG_MIN))
			  || (errno != 0 && value == 0))
		return -1;

	if (endptr == argv) {
		switch (arg_type) {
		case ARG_SPI_DEVICE:
			return ldx_spi_get_device(endptr);
		case ARG_SPI_SLAVE:
			return ldx_spi_get_slave(endptr);
		default:
			return -1;
		}
	}

	return value;
}

/*
 * enable_write() - Sets the SPI write enable bit
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE otherwise.
 */
static int enable_write(void)
{
	uint8_t write_data[1] = {0};

	printf("[INFO] Setting write enable bit...\n");
	write_data[0] = WREN;

	return ldx_spi_write(spi_dev, write_data, sizeof(write_data));
}

/*
 * read_status_register() - Reads the SPI status register
 *
 * @status:	Variable to store the read status.
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE otherwise.
 */
static int read_status_register(uint8_t *status)
{
	uint8_t write_data[2] = {0};
	uint8_t read_data[2] = {0};

	printf("[INFO] Reading status register...\n");
	write_data[0] = RDSR;
	if (ldx_spi_transfer(spi_dev, write_data, read_data, 2) != EXIT_SUCCESS) {
		return EXIT_FAILURE;
	}

	printf("[INFO] SPI Status Register is 0x%02x\n", read_data[1]);
	*status = read_data[1];

	return EXIT_SUCCESS;
}

/*
 * write_page() - Writes an EEPROM page with the given data
 *
 * @page_index:	index of the EEPROM page to write.
 * @data:	the data to write.
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE otherwise.
 */
static int write_page(int page_index, uint8_t* data)
{
	uint8_t *write_data;
	uint16_t page_address = page_size * page_index;
	uint8_t status = 0;
	int i, ret = 0;

	/* Create the page write buffer */
	write_data = (uint8_t *)calloc(page_size + OPERATION_BYTES + address_bytes,
			  sizeof(uint8_t));
	if (write_data == NULL) {
		printf("Unable to allocate memory to write the page.");
		return EXIT_FAILURE;
	}

	printf("[INFO] Writing %d bytes to page %d at address 0x%x...\n", page_size,
			  page_index, page_address);
	write_data[0] = WRITE; // Operation.
	for (i = 0; i < address_bytes; i++) {
		write_data[i + OPERATION_BYTES] = (page_address >> (8 * (address_bytes -
				  i - 1)));
	}

	/* Fill the data array. */
	for (i = 0; i < page_size; i++) {
		write_data[(i + OPERATION_BYTES + address_bytes)] = data[i];
	}

	/* Perform the write operation. */
	if (ldx_spi_write(spi_dev, write_data, page_size + OPERATION_BYTES +
			  address_bytes) != EXIT_SUCCESS) {
		free(write_data);
		return EXIT_FAILURE;
	}

	/* Wait for the operation to complete. */
	do {
		/* Read the status register to check the WIP (write-in-progress) bit. */
		ret = read_status_register(&status);
		if (ret != EXIT_SUCCESS) {
			free(write_data);
			return EXIT_FAILURE;
		}
		/* Check the WIP (write-in-progress) status bit. */
		if (status & 0x01) {
			printf("[INFO] Write in progress...\n");
			usleep(1);
		} else {
			printf("[INFO] Write finished!\n");
		}
	} while (status & 0x1);

	free(write_data);

	return EXIT_SUCCESS;
}

/*
 * read_page() - Reads an EEPROM page
 *
 * @page_index:	index of the EEPROM page to read.
 * @data:	buffer to store the read data in.
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE otherwise.
 */
static int read_page(int page_index, uint8_t* data)
{
	uint8_t *write_data;
	uint8_t *read_data;
	uint16_t page_address;
	int i = 0;

	page_address = page_size * page_index;

	/* Create the buffers */
	write_data = (uint8_t *)calloc(page_size + OPERATION_BYTES + address_bytes,
			  sizeof(uint8_t));
	read_data = (uint8_t *)calloc(page_size + OPERATION_BYTES + address_bytes,
			  sizeof(uint8_t));
	if (write_data == NULL || read_data == NULL) {
		printf("Unable to allocate memory to read the page.");
		return EXIT_FAILURE;
	}

	printf("[INFO] Reading page %d at address 0x%x...\n", page_index,
			  page_address);
	write_data[0] = READ; // Operation.
	for (i = 0; i < address_bytes; i++) {
		write_data[i + OPERATION_BYTES] = (page_address >> (8 * (address_bytes -
				i - 1)));
	}

	/* Perform the read operation with a transfer */
	if (ldx_spi_transfer(spi_dev, write_data, read_data, page_size +
			  OPERATION_BYTES + address_bytes) != EXIT_SUCCESS) {
		free(write_data);
		free(read_data);
		return EXIT_FAILURE;
	}
	for (i = 0; i < page_size; i++) {
		data[i] = read_data[(i + OPERATION_BYTES + address_bytes)];
	}

	free(write_data);
	free(read_data);

	return EXIT_SUCCESS;
}

int main(int argc, char *argv[])
{
	int spi_device = 0, spi_slave = 0, page_index = 0, i = 0;
	spi_transfer_cfg_t transfer_mode = {0};
	char *name = basename(argv[0]);

	/* Check input parameters */
	if (argc == 1) {
		/* Use default values */
		spi_device = ldx_spi_get_device(DEFAULT_SPI_ALIAS);
		spi_slave = ldx_spi_get_slave(DEFAULT_SPI_ALIAS);
		address_bytes = DEFAULT_SPI_ADDRESS_SIZE;
		page_size = DEFAULT_SPI_PAGE_SIZE;
		page_index = DEFAULT_SPI_PAGE_INDEX;
	} else if (argc == 6) {
		/* Parse command line arguments */
		spi_device = parse_argument(argv[1], ARG_SPI_DEVICE);
		spi_slave = parse_argument(argv[2], ARG_SPI_SLAVE);
		address_bytes = atoi(argv[3]);
		page_size = atoi(argv[4]);
		page_index = atoi(argv[5]);
	} else {
		usage_and_exit(name, EXIT_FAILURE);
	}

	if (spi_device < 0 || spi_slave < 0) {
		printf("Unable to parse SPI device/slave arguments\n");
		return EXIT_FAILURE;
	}
	if (address_bytes <= 0) {
		printf("Address bytes must be greater than 0\n");
		return EXIT_FAILURE;
	}
	if (page_size <= 0) {
		printf("Page size must be greater than 0\n");
		return EXIT_FAILURE;
	}
	if (page_index < 0) {
		printf("Page index must be greater or equal than 0\n");
		return EXIT_FAILURE;
	}

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	/* Request SPI */
	spi_dev = ldx_spi_request((unsigned int)spi_device, (unsigned int)spi_slave);
	if (!spi_dev) {
		printf("Failed to initialize SPI\n");
		return EXIT_FAILURE;
	}

	/* Configure the transfer mode */
	transfer_mode.clk_mode = CLK_MODE;
	transfer_mode.chip_select = CHIP_SELECT;
	transfer_mode.bit_order = BIT_ORDER;
	if (ldx_spi_set_transfer_mode(spi_dev, &transfer_mode) != EXIT_SUCCESS) {
		printf("Failed to configure SPI transfer mode\n");
		return EXIT_FAILURE;
	}

	/* Configure the bits-per-word */
	if (ldx_spi_set_bits_per_word(spi_dev, BITS_PER_WORD) != EXIT_SUCCESS) {
		printf("Failed to configure SPI bits-per-word\n");
		return EXIT_FAILURE;
	}

	/* Configure the max bus speed */
	if (ldx_spi_set_speed(spi_dev, MAX_BUS_SPEED) != EXIT_SUCCESS) {
		printf("Failed to configure SPI max bus speed\n");
		return EXIT_FAILURE;
	}

	/* Set the write-enable bit. */
	if (enable_write() != EXIT_SUCCESS) {
		printf("Failed to set the write-enable bit\n");
		return EXIT_FAILURE;
	}

	/* Initialize the write and read buffers */
	tx_buffer = (uint8_t *)calloc(page_size, sizeof(uint8_t));
	rx_buffer = (uint8_t *)calloc(page_size, sizeof(uint8_t));
	if (tx_buffer == NULL || rx_buffer == NULL) {
		printf("Failed to initialize read/write buffers\n");
		return EXIT_FAILURE;
	}

	/* Fill the data to write with random bytes. */
	srand(time(NULL));
	for (i = 0; i < (page_size); i++) {
		tx_buffer[i] = rand() % 255;
	}

	/* Write the page. */
	if (write_page(page_index, tx_buffer) != EXIT_SUCCESS) {
		printf("Write page failed\n");
		return EXIT_FAILURE;
	}

	/* Read the page. */
	if (read_page(page_index, rx_buffer) != EXIT_SUCCESS) {
		printf("Read page failed\n");
		return EXIT_FAILURE;
	}

	/* Validate the read data. */
	printf("[INFO] Validating read data...\n");
	for (i = 0; i < page_size; i++) {
		printf("  Byte %d: Write 0x%02x - Read 0x%02x", i,
				tx_buffer[i], rx_buffer[i]);
		if (tx_buffer[i] == rx_buffer[i]) {
			printf(" - Correct\n");
		} else {
			printf(" - Incorrect\n");
		}
	}

	/* 'atexit' executes the cleanup function */
	return EXIT_SUCCESS;
}
