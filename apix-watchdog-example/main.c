/*
 * Copyright 2018, Digi International Inc.
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

#include <libgen.h>
#include <signal.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include "libdigiapix/watchdog.h"

#define DEFAULT_WD_DEVICE_FILE		"/dev/watchdog"
#define DEFAULT_WD_TIMEOUT		10
#define DEFAULT_WD_TEST_TIME		60

static wd_t *wd;

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
		"Example application using libdigiapix Watchdog support\n"
		"\n"
		"Usage: %s <watchdog_device> <timeout> <test_time> \n\n"
		"<watchdog_device>    Watchdog device file to manage\n"
		"<timeout>            Timeout to set Watchdog timer (default 10)\n"
		"<test_time>          Test duration in seconds (default 60)\n"
		"\n", name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	/* Free watchdog */
	ldx_watchdog_free(wd);
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

int main(int argc, char *argv[])
{
	int timeout = 0, test_time = 0;
	char *arg = NULL;
	char *name = basename(argv[0]);
	char wd_device_file[512] = {0};

	/* Check input parameters */
	if (argc == 1) {
		/* Use default values */
		strcpy(wd_device_file, DEFAULT_WD_DEVICE_FILE);
		timeout = DEFAULT_WD_TIMEOUT;
		test_time = DEFAULT_WD_TEST_TIME;
	} else if (argc == 4) {
		/* Parse command line arguments */
		timeout = (int)strtol(argv[2], &arg, 10);
		if (*arg || timeout <= 0) {
			printf("%s: Invalid timeout value\n", __func__);
			return EXIT_FAILURE;
		}
		test_time = (int)strtol(argv[3], &arg, 10);
		if (*arg || test_time <= 0) {
			printf("%s: Invalid test time value\n", __func__);
			return EXIT_FAILURE;
		}
		strcpy(wd_device_file, argv[1]);
	} else {
		usage_and_exit(name, EXIT_FAILURE);
	}

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	wd = ldx_watchdog_request(wd_device_file);
	if (!wd) {
		printf("Failed to initialize Watchdog\n");
		return EXIT_FAILURE;
	}

	/* Configure watchdog timeout */
	if (ldx_watchdog_set_timeout(wd, timeout) != 0) {
		printf("Failed to set watchdog timeout to %d seconds\n", timeout);
		return EXIT_FAILURE;
	}
	printf("Watchdog timeout modified to %d seconds\n", timeout);

	while (test_time > 0) {
		printf("Refreshing watchdog timer (%d s)\n", test_time);
		ldx_watchdog_refresh(wd);
		sleep(1);
		test_time--;
	}

	while (timeout > 0) {
		printf("System will reboot in %d s\n", timeout - 1);
		sleep(1);
		timeout--;
	}

	return EXIT_SUCCESS;
}
