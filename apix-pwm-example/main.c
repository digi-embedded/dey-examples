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

#include <libdigiapix/pwm.h>

#define DEFAULT_PWM_CHANNEL	0

static pwm_t *pwm_line;
static int running = 1;

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
		"Example application using libdigiapix PWM support\n"
		"\n"
		"Usage: %s <pwm-chip> <pwm-freq>\n\n"
		"<pwm-chip>       PWM chip number or alias\n"
		"<pwm-freq>       Frequency to use (Hz)\n\n", name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	running = 0;
	if (pwm_line) {
		ldx_pwm_enable(pwm_line, PWM_DISABLED);
		ldx_pwm_free(pwm_line);
	}
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
 *
 * Return: The parsed integer argument, -1 on error.
 */
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
		return ldx_pwm_get_channel(endptr);

	return value;
}

int main(int argc, char **argv)
{
	int ret, duty_cycle = 10, ascending = 1;
	char *name = basename(argv[0]);
	unsigned int pwm_chip, pwm_freq = 0;

	/* Check if the PWM values are passed in the command line. */
	if (argc != 3)
		usage_and_exit(name, EXIT_FAILURE);

	pwm_chip = parse_argument(argv[1]);
	pwm_freq = atoi(argv[2]);

	if (pwm_chip < 0) {
		printf("Unable to parse PWM chip\n");
		return EXIT_FAILURE;
	}

	if (pwm_freq <= 0) {
		printf("Frequency must be greater than 0\n");
		return EXIT_FAILURE;
	}

	pwm_line = ldx_pwm_request(pwm_chip, DEFAULT_PWM_CHANNEL, REQUEST_SHARED);

	/* Check PWM. */
	if (!pwm_line) {
		printf("Failed to initialize PWM\n");
		return EXIT_FAILURE;
	}

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	printf("Setting PWM frequency to %dHz...", pwm_freq);
	/* Set a duty cycle of 0 to avoid errors configuring the frequency */
	ldx_pwm_set_duty_cycle(pwm_line, 0);
	ret = ldx_pwm_set_freq(pwm_line, pwm_freq);
	if (ret != PWM_CONFIG_ERROR_NONE) {
		printf("Failed\n");
		return EXIT_FAILURE;
	}

	/* Check the frequency. */
	ret = ldx_pwm_get_freq(pwm_line);
	printf("%s\n", ret >= 0 ? "Done" : "Failed");
	if (ret == -1) {
		return EXIT_FAILURE;
	}

	printf("Enabling PWM %d:%d...", pwm_line->chip, pwm_line->channel);
	ret = ldx_pwm_enable(pwm_line, PWM_ENABLED);
	if (ret != EXIT_SUCCESS) {
		printf("Failed\n");
		return EXIT_FAILURE;
	}

	ret = ldx_pwm_is_enabled(pwm_line);
	printf("%s\n", ret == PWM_ENABLED ? "Done" : "Failed");
	if (ret != PWM_ENABLED) {
		return EXIT_FAILURE;
	}

	/* Main application loop.*/
	while (running) {
		/* Set the duty cycle. */
		ret = ldx_pwm_set_duty_cycle_percentage(pwm_line, duty_cycle);
		if (ret != PWM_CONFIG_ERROR_NONE) {
			printf("Failed to set the duty cycle\n");
			return EXIT_FAILURE;
		}
		if (ascending) {
			duty_cycle += 10;
			if (duty_cycle == 100) {
				duty_cycle = 80;
				ascending = 0;
			}
		} else {
			duty_cycle -= 10;
			if (duty_cycle == 0) {
				duty_cycle = 20;
				ascending = 1;
			}
		}
		sleep(1);
	}

	return EXIT_SUCCESS;
}
