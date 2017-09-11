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
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include <libdigiapix/gpio.h>

#define TEST_LOOPS	6

static gpio_t *gpio_input;
static gpio_t *gpio_output;

struct gpio_interrupt_cb_data {
	gpio_t *gpio;
	gpio_value_t value;
	int remaining_loops;
};

/*
 * Function:    usage_and_exit
 * Description: show usage information and exit with 'exitval' return value
 */
static void usage_and_exit(char *name, int exitval)
{
	fprintf(stdout,
		"Example application using libdigiapix GPIO support\n"
		"\n"
		"Usage: %s <gpio_in> <gpio_out>\n\n"
		"<gpio_in>     Push-button GPIO number or alias\n"
		"<gpio_out>    LED GPIO number or alias\n"
		"\n"
		"Aliases for GPIO numbers can be configured in the library config file\n"
		"\n", name);

	exit(exitval);
}

static void cleanup(void)
{
	/* Stop the interrupt handler thread */
	gpio_stop_wait_interrupt(gpio_input);

	/* Free gpios */
	gpio_free(gpio_input);
	gpio_free(gpio_output);
}

static void sigaction_handler(int signum)
{
	/* 'atexit' executes the cleanup function */
	exit(EXIT_FAILURE);
}

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

static int gpio_interrupt_cb(void *arg)
{
	struct gpio_interrupt_cb_data *data = arg;

	printf("Input GPIO interrupt detected; toggling output GPIO\n");

	/* Toggle output GPIO */
	data->value = data->value ? GPIO_LOW : GPIO_HIGH;
	gpio_set_value(data->gpio, data->value);

	/* Decrease remaining loops */
	data->remaining_loops -= 1;

	return 0;
}

static int parse_argument(char *argv)
{
	char *endptr;
	long value;

	errno = 0;
	value = strtol(argv, &endptr, 10);

	if ((errno == ERANGE && (value == LONG_MAX || value == LONG_MIN))
	    || (errno != 0 && value == 0))
		return -1;

	if (endptr == argv)
		return gpio_get_kernel_number(endptr);

	return value;
}

int main(int argc, char *argv[])
{
	int button, led, i;
	gpio_value_t output_value = GPIO_LOW;	/* Should match the GPIO request mode */
	struct gpio_interrupt_cb_data cb_data;
	char *name = basename(argv[0]);

	/* Check input parameters */
	if (argc != 3)
		usage_and_exit(name, EXIT_FAILURE);

	/* Parse command line arguments */
	button = parse_argument(argv[1]);
	led = parse_argument(argv[2]);
	if (button < 0 || led < 0) {
		printf("Unable to parse button and led GPIOs\n");
		return EXIT_FAILURE;
	}

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	/* Request input GPIO */
	gpio_input =
	    gpio_request((unsigned)button, GPIO_IRQ_EDGE_RISING,
			 REQUEST_SHARED);
	if (!gpio_input) {
		printf("Failed to initialize input GPIO\n");
		return EXIT_FAILURE;
	}

	/* Request output GPIO */
	gpio_output =
	    gpio_request((unsigned)led, GPIO_OUTPUT_LOW, REQUEST_SHARED);
	if (!gpio_output) {
		printf("Failed to initialize output GPIO\n");
		return EXIT_FAILURE;
	}

	/* Configure input GPIO to active HIGH */
	gpio_set_active_mode(gpio_input, GPIO_ACTIVE_HIGH);

	/*
	 * Test blocking interrupt mode
	 */
	printf("[INFO] Testing interrupt blocking mode\n");
	printf("Press the button (for %d events):\n", TEST_LOOPS);
	for (i = 0; i < TEST_LOOPS; i++) {
		if (gpio_wait_interrupt(gpio_input, -1) == GPIO_IRQ_ERROR_NONE) {
			printf("Press %d; toggling output GPIO\n", i + 1);
			output_value = output_value ? GPIO_LOW : GPIO_HIGH;
			gpio_set_value(gpio_output, output_value);
		}
	}

	/*
	 * Test async mode
	 */
	printf("[INFO] Testing interrupt asynchronous mode\n");

	/* Initialize data to be passed to the interrupt handler */
	cb_data.gpio = gpio_output;
	cb_data.value = output_value;
	cb_data.remaining_loops = TEST_LOOPS;

	printf
	    ("Parent process will wait until %d interrupts have been detected\n",
	     TEST_LOOPS);

	if (gpio_start_wait_interrupt(gpio_input, &gpio_interrupt_cb, &cb_data)
	    != EXIT_SUCCESS) {
		printf("Failed to start interrupt handler thread\n");
		return EXIT_FAILURE;
	}

	/* Parent process */
	while (cb_data.remaining_loops > 0) {
		printf("Parent process: waiting ...\n");
		sleep(5);
	}
	printf("Parent process: no remaining interrupts. Test finished\n");

	/* 'atexit' executes the cleanup function */
	return EXIT_SUCCESS;
}
