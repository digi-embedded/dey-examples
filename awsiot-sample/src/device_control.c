/*
 * Copyright (c) 2017 Digi International Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 * =======================================================================
 */
#include <aws_iot_log.h>
#include <dirent.h>
#include <stdarg.h>
#include <string.h>
#include <unistd.h>

#include "device_control.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define MAX_LENGTH		256

#define FILE_CPU_TEMP		"/sys/class/thermal/thermal_zone0/temp"
#define FILE_CPU_LOAD		"/proc/stat"

#define PATH_GPIO_FILES		"/sys/class/gpio/"
#define EXPORT_FILE		PATH_GPIO_FILES "export"
#define GPIO_DIR_FILE_FORMAT	PATH_GPIO_FILES "gpio%d/direction"
#define GPIO_VALUE_FILE_FORMAT	PATH_GPIO_FILES "gpio%d/value"

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static int export_gpio(int gpio);
static int is_gpio_exported( int gpio);
static long read_file(const char * path, char *buffer, long bytes_to_read);
static int write_file(const char *const path, const char *const format, ...);

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
/*
 * get_cpu_load() - Get the CPU load of the system
 *
 * Return: The CPU load in %, -1 if the value is not available.
 */
double get_cpu_load(void)
{
	static unsigned long long last_work = 0, last_total = 0;
	char data[MAX_LENGTH] = {0};
	unsigned long long int fields[10];
	unsigned long long work = 0, total = 0;
	double usage = -1;
	int i, result;

	if (read_file(FILE_CPU_LOAD, data, MAX_LENGTH) <= 0) {
		IOT_ERROR("Error reading cpu load file");
		return usage;
	}

	result = sscanf(data, "cpu %llu %llu %llu %llu %llu %llu %llu %llu %llu %llu",
			&fields[0], &fields[1], &fields[2], &fields[3], &fields[4],
			&fields[5], &fields[6], &fields[7], &fields[8], &fields[9]);

	if (result < 4) {
		IOT_ERROR("CPU load not enough fields error");
		return usage;
	}

	for (i = 0; i < 3; i++) {
		work += fields[i];
	}
	for (i = 0; i < result; i++) {
		total += fields[i];
	}

	if (last_work == 0 && last_total == 0) {
		/* The first time report 0%. */
		usage = 0;
	} else {
		unsigned long long diff_work = work - last_work;
		unsigned long long diff_total = total - last_total;

		usage = diff_work * 100.0 / diff_total;
	}

	last_total = total;
	last_work = work;

	return usage;
}

/*
 * get_cpu_temp() - Get the CPU temperature of the system
 *
 * Return: The CPU temperature in C, -1 if error.
 */
double get_cpu_temp(void)
{
	char file_data[MAX_LENGTH] = {0};
	double temperature ;
	int result;

	if (read_file(FILE_CPU_TEMP, file_data, MAX_LENGTH) <= 0) {
		IOT_ERROR("Error reading CPU temperature file");
		return -1;
	}

	result = sscanf(file_data, "%lf", &temperature);
	if (result < 1) {
		IOT_ERROR("Error getting CPU temperature: not enough fields");
		return -1;
	}
	return temperature / 1000;
}

/**
 * init_gpio() - Export and initialize a GPIO
 *
 * @gpio:		GPIO kernel number
 *
 * The provided GPIO is exported and configured as input with edge "none".
 *
 * Return: 0 if the GPIO was initialized successfully, -1 otherwise.
 */
int init_gpio(int gpio)
{
	int error = 0;

	if (gpio < 0) {
		IOT_ERROR("Bad GPIO number '%d'", gpio);
		return -1;
	}

	/* Export the GPIO. */
	if (export_gpio(gpio) != 0) {
		IOT_ERROR("Cannot initialize GPIO %d", gpio);
		return -1;
	}

	/* Configure GPIO as input. */
	error = set_gpio_direction(gpio, INPUT);
	if (error != 0)
		IOT_ERROR("Cannot initialize GPIO %d", gpio);

	return error;
}

/**
 * set_gpio_value() - Set GPIO value, if it is configured as an output
 *
 * @gpio:	GPIO kernel number.
 * @value:	1 to set to high, 0 to low.
 *
 * Return: 0 if the GPIO was successfully set, -1 otherwise.
 */
int set_gpio_value(int gpio, unsigned int value)
{
	char gpio_path[MAX_LENGTH] = {0};

	if (gpio < 0) {
		IOT_ERROR("Bad GPIO number '%d'", gpio);
		return -1;
	}

	snprintf(gpio_path, MAX_LENGTH, GPIO_VALUE_FILE_FORMAT, gpio);

	if (write_file(gpio_path, "%d", value) != 0) {
		IOT_ERROR("Error setting GPIO %d value to %s (%d)", gpio,
			  value ? "high" : "low", value);
		return -1;
	}

	return 0;
}

/**
 * set_gpio_direction() - Set GPIO direction, input or output
 *
 * @gpio:		GPIO kernel number.
 * @out:		1 to configure as out, 0 as input.
 *
 * Return: 0 if the GPIO was successfully configured, -1 otherwise.
 */
int set_gpio_direction(int gpio, unsigned int out)
{
	char gpio_path[MAX_LENGTH] = {0};
	char buf[MAX_LENGTH] = {0};

	IOT_DEBUG("GPIO %d as %s", gpio, out ? "Output" : "Input");

	if (gpio < 0) {
		IOT_ERROR("Bad GPIO number '%d'", gpio);
		return -1;
	}

	snprintf(gpio_path, MAX_LENGTH, GPIO_DIR_FILE_FORMAT, gpio);

	if (out)
		strcpy(buf, "out");
	else
		strcpy(buf, "in");

	if (write_file(gpio_path, "%s", buf) != 0) {
		IOT_ERROR("Error setting GPIO %d direction to '%s'", gpio,
			  out ? "Output" : "Input");
		return -1;
	}

	return 0;
}

/**
 * export_gpio() - Export a GPIO
 *
 * @gpio:	GPIO kernel number.
 *
 * Return: 0 if the GPIO was successfully exported, -1 otherwise.
 */
static int export_gpio(int gpio)
{
	if (gpio < 0) {
		IOT_ERROR("Bad GPIO number '%d'", gpio);
		return -1;
	}

	if (is_gpio_exported(gpio))
		return 0;

	if (write_file(EXPORT_FILE, "%d", gpio) != 0) {
		IOT_ERROR("GPIO %d not exported, error writing to 'export' file",
			  gpio);
		return -1;
	}

	/* Check if the GPIO was really exported. */
	if (!is_gpio_exported(gpio)) {
		IOT_ERROR("GPIO %d not exported", gpio);
		return -1;
	}

	return 0;
}

/**
 * is_gpio_exported() - Check if a GPIO is exported
 *
 * @gpio:	GPIO kernel number.
 *
 * Return: 1 if the GPIO is exported, 0 otherwise.
 */
static int is_gpio_exported( int gpio)
{
	char dir_path[MAX_LENGTH] = {0};
	DIR *dir = NULL;

	snprintf(dir_path, MAX_LENGTH, PATH_GPIO_FILES "gpio%d", gpio);

	dir = opendir(dir_path);

	if (dir) {
		closedir(dir);
		return 1;
	} else {
		return 0;
	}
}

/**
 * read_file() - Read the given file and returns its contents
 *
 * @path:		Absolute path of the file to read.
 * @buffer:		Buffer to store the contents of the file.
 * @bytes_to_read:	The number of bytes to read (including the terminating
 * 			null byte).
 *
 * Return: The number of read bytes (including the terminating null byte), -1 on
 * 		error.
 */
static long read_file(const char * path, char *buffer, long bytes_to_read)
{
	FILE *fd = NULL;
	long read_size = 0;

	if (access(path, R_OK) != 0) {
		IOT_DEBUG("File cannot be read: %s", path);
		return -1;
	}

	if ((fd = fopen(path, "rb")) == NULL) {
		IOT_DEBUG("fopen error: %s", path);
		return -1;
	}

	if (fgets(buffer, bytes_to_read, fd) == NULL) {
		IOT_DEBUG("fgets error: %s", path);
		read_size = -1;
	} else {
		read_size = strlen(buffer) + 1;
	}
	fclose(fd);

	return read_size;
}

/**
 * write_file() - Write data to a file
 *
 * @path:	Absolute path of the file to be written.
 * @format:	String that contains the text to be written to the file.
 *
 * Return: 0 if the file was written successfully, -1 otherwise.
 */
static int write_file(const char *const path, const char *const format, ...)
{
	va_list args;
	FILE *f = NULL;
	int len, error = 0;

	if (access(path, W_OK) != 0) {
		IOT_DEBUG("File cannot be written: %s", path);
		return -1;
	}

	va_start(args, format);

	f = fopen(path, "w");
	if (f == NULL) {
		IOT_DEBUG("fopen error: %s", path);
		error = -1;
		goto done;
	}

	len = vfprintf(f, format, args);
	if (len < 0) {
		IOT_DEBUG("vfprintf error: %s", path);
		error = -1;
	}

	fsync(fileno(f));
	fclose(f);

done:
	va_end(args);

	return error;
}
