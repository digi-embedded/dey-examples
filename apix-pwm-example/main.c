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
#include <libgen.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include <pwm.h>

/*------------------------------------------------------------------------------
							 D E F I N I T I O N S
------------------------------------------------------------------------------*/

#define DEFAULT_PWM_CHANNEL	0
#define DEFAULT_FREQUENCY	1000 /* In Hz */
#define DEFAULT_PWM_ALIAS	"DEFAULT_PWM"


#define BUFF_SIZE 256
#define USAGE							\
	"Usage:\n"						\
	"%s [pwm-chip pwm-freq]\n\n"		\
	"Where:\n"						\
	"  'pwm-chip' is an optional PWM chip number\n"		\
	"  'pwm-freq' is an optional frequency to use (Hz)\n\n" \

/*------------------------------------------------------------------------------
			F U N C T I O N	 D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static void cleanup();
static void add_sigkill_signal(void);
static void graceful_shutdown(void);
static void sigint_handler(int signum);
static void usage(char const * const name);

/**
 * sigint_handler() - Manage signal received.
 *
 * @signum: Received signal.
 */
static void sigint_handler(int signum)
{
	exit(EXIT_SUCCESS);
}

/**
 * usage() - Print usage information
 *
 * @name:	Name of the application.
 */
static void usage(char const * const name)
{
	printf(USAGE, name);
}

/*------------------------------------------------------------------------------
			G L O B A L  V A R I A B L E S
------------------------------------------------------------------------------*/
static pwm_t *pwm_line;
static int running = 1;

int main(int argc, char **argv)
{
	unsigned int pwm_freq = DEFAULT_FREQUENCY;
	int ret, duty_cycle = 10, ascending = 1;
	char *name = basename(argv[0]);

	/* Check if the PWM values are passed in the command line. */
	if (argc == 3) {
		unsigned int pwm_chip = atoi(argv[1]);
		pwm_freq = atoi(argv[2]);
		pwm_line = pwm_request(pwm_chip, DEFAULT_PWM_CHANNEL, REQUEST_SHARED);
	} else if (argc == 1) {
		/* Initialize the PWM. */
		pwm_line = pwm_request_by_alias(DEFAULT_PWM_ALIAS, REQUEST_SHARED);
	} else if (argc <= 2 || argc > 3) {
		usage(name);
		return EXIT_FAILURE;
	}

	/* Check PWM. */
	if (!pwm_line) {
		printf("Failed to initialize PWM\n");
		return EXIT_FAILURE;
	}

	add_sigkill_signal();

	printf("Setting PWM frequency to %dHz...", pwm_freq);
	/* Set a duty cycle of 0 to avoid errors configuring the frequency */
	pwm_set_duty_cycle(pwm_line, 0);
	ret = pwm_set_freq(pwm_line, pwm_freq);
	if (ret != PWM_CONFIG_ERROR_NONE) {
		printf("Failed\n");
		return EXIT_FAILURE;
	}

	/* Check the frequency. */
	ret = pwm_get_freq(pwm_line);
	printf("%s\n", ret >= 0 ? "Done" : "Failed");
	if (ret == -1) {
		return EXIT_FAILURE;
	}

	printf("Enabling PWM %d:%d...", pwm_line->chip, pwm_line->channel);
	ret = pwm_enable(pwm_line, PWM_ENABLED);
	if (ret != EXIT_SUCCESS) {
		printf("Failed\n");
		return EXIT_FAILURE;
	}

	ret = pwm_is_enabled(pwm_line);
	printf("%s\n", ret == PWM_ENABLED ? "Done" : "Failed");
	if (ret != PWM_ENABLED) {
		return EXIT_FAILURE;
	}

	/* Main application loop.*/
	while (running) {
		/* Set the duty cycle. */
		ret = pwm_set_duty_cycle_percentage(pwm_line, duty_cycle);
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

/**
 * cleanup() - Frees and leaves PWM into a known state before exit
 */
static void cleanup()
{
	if (pwm_line) {
		pwm_enable(pwm_line, PWM_DISABLED);
		pwm_free(pwm_line);
	}
}

/**
 * add_sigkill_signal() - Add the kill signal to the process
 */
static void add_sigkill_signal(void)
{
	struct sigaction new_action;
	struct sigaction old_action;

	/* Setup signal hander. */
	atexit(graceful_shutdown);
	new_action.sa_handler = sigint_handler;
	sigemptyset(&new_action.sa_mask);
	new_action.sa_flags = 0;
	sigaction(SIGINT, NULL, &old_action);

	if (old_action.sa_handler != SIG_IGN)
		sigaction(SIGINT, &new_action, NULL);
}

/**
 * graceful_shutdown() - Stop main loop
 */
void graceful_shutdown(void)
{
	running = 0;
	cleanup();
}
