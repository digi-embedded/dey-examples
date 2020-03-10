/*
 * Copyright 2017-2020, Digi International Inc.
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
#include <string.h>

#include <libdigiapix/gpio.h>

#define TEST_LOOPS			6
#define DEFAULT_USER_LED_ALIAS		"USER_LED"
#define DEFAULT_USER_BUTTON_ALIAS	"USER_BUTTON"

static gpio_t *gpio_input;
static gpio_t *gpio_output;

struct gpio_interrupt_cb_data {
	gpio_t *gpio;
	gpio_value_t value;
	int remaining_loops;
};

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
		"Example application using libdigiapix GPIO support\n"
		"\n"
		"Usage: %s\n"
		"                     %s is used as Push-button GPIO alias\n"
		"                     %s is used as LED GPIO alias\n"
		"\n"
		"Usage: %s <gpio-in-alias> <gpio-out-alias>\n"
		"<gpio-in-alias>      Push-button GPIO alias\n"
		"<gpio-out-alias>     LED GPIO alias\n"
		"\n"
		"Usage: %s <gpio_in_ctrl> <gpio_in_line> <gpio_out_ctrl> <gpio_out_line>\n"
		"<gpio_in_ctrl>  Push-button GPIO controller name\n"
		"<gpio_in_line>  Push-button GPIO line number\n"
		"<gpio_out_ctrl> LED GPIO controller name\n"
		"<gpio_out_line> LED GPIO line number\n"
		"\n"
		"Aliases for GPIO can be configured in the library config file\n"
		"\n", name, DEFAULT_USER_BUTTON_ALIAS, DEFAULT_USER_LED_ALIAS, name, name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	/* Stop the interrupt handler thread */
	ldx_gpio_stop_wait_interrupt(gpio_input);

	/* Free gpios */
	ldx_gpio_free(gpio_input);
	ldx_gpio_free(gpio_output);
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
 * gpio_interrupt_cb() - GPIO callback for interrupts
 *
 * @arg:	GPIO interrupt data (struct gpio_interrupt_cb_data).
 */
static int gpio_interrupt_cb(void *arg)
{
	struct gpio_interrupt_cb_data *data = arg;

	printf("Input GPIO interrupt detected; toggling output GPIO\n");

	/* Toggle output GPIO */
	data->value = data->value ? GPIO_LOW : GPIO_HIGH;
	ldx_gpio_set_value(data->gpio, data->value);

	/* Decrease remaining loops */
	data->remaining_loops -= 1;

	return 0;
}

int main(int argc, char *argv[])
{
	static char button_ctrl[MAX_CONTROLLER_LEN] = { 0 };
	static char led_ctrl[MAX_CONTROLLER_LEN] = { 0 };
	int button_line, led_line, i;
	gpio_value_t output_value = GPIO_LOW;	/* Should match the GPIO request mode */
	struct gpio_interrupt_cb_data cb_data;
	char *name = basename(argv[0]);

	/* Check input parameters */
	if (argc == 1) {
		/* Use default values */
		ldx_gpio_get_controller(DEFAULT_USER_BUTTON_ALIAS, button_ctrl);
		button_line = ldx_gpio_get_line(DEFAULT_USER_BUTTON_ALIAS);
		ldx_gpio_get_controller(DEFAULT_USER_LED_ALIAS, led_ctrl);
		led_line = ldx_gpio_get_line(DEFAULT_USER_LED_ALIAS);
	} else if (argc == 3) {
		/* Parse command line arguments as ALIASES */
		ldx_gpio_get_controller(argv[1], button_ctrl);
		button_line = ldx_gpio_get_line(argv[1]);
		ldx_gpio_get_controller(argv[2], led_ctrl);
		led_line = ldx_gpio_get_line(argv[2]);
	} else if (argc == 5) {
		/* Parse command line arguments as controller/line */
		strcpy(button_ctrl, argv[1]);
		button_line = strtol(argv[2], NULL, 10);
		strcpy(led_ctrl, argv[3]);
		led_line = strtol(argv[4], NULL, 10);
	} else {
		usage_and_exit(name, EXIT_FAILURE);
	}

	if (button_ctrl == NULL || button_line < 0 ||
		led_ctrl == NULL || led_line < 0) {
		printf("Unable to parse button and led GPIOs\n");
		return EXIT_FAILURE;
	}

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	/* Request input GPIO */
	gpio_input = ldx_gpio_request_by_controller(button_ctrl, button_line,
						    GPIO_IRQ_EDGE_RISING);
	if (!gpio_input) {
		printf("Failed to initialize input GPIO\n");
		return EXIT_FAILURE;
	}

	/* Request output GPIO */
	gpio_output = ldx_gpio_request_by_controller(led_ctrl, led_line,
						     GPIO_OUTPUT_LOW);
	if (!gpio_output) {
		printf("Failed to initialize output GPIO\n");
		return EXIT_FAILURE;
	}

	/* Configure input GPIO to active HIGH */
	ldx_gpio_set_active_mode(gpio_input, GPIO_ACTIVE_HIGH);

	/*
	 * Test blocking interrupt mode
	 */
	printf("[INFO] Testing interrupt blocking mode\n");
	printf("Press the button (for %d events):\n", TEST_LOOPS);
	for (i = 0; i < TEST_LOOPS; i++) {
		if (ldx_gpio_wait_interrupt(gpio_input, -1) == GPIO_IRQ_ERROR_NONE) {
			printf("Press %d; toggling output GPIO\n", i + 1);
			output_value = output_value ? GPIO_LOW : GPIO_HIGH;
			ldx_gpio_set_value(gpio_output, output_value);
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

	if (ldx_gpio_start_wait_interrupt(gpio_input, &gpio_interrupt_cb, &cb_data)
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
