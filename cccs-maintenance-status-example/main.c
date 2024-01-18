/*
 * Copyright 2023, Digi International Inc.
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

#include <cccs_services.h>
#include <errno.h>
#include <libgen.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MNT_INTERVAL	60 /* seconds */
#define LOOP_MS		100

static bool stop_requested = false;

/*
 * usage_and_exit() - Show usage information and exit with 'val' return value
 *
 * @name:	Application name.
 * @val:	The exit code.
 */
static void usage_and_exit(char *name, int val)
{
	fprintf(stdout,
		"Example application to alternate 'in maintenance' and 'in service' status\n"
		"\n"
		"Usage: %s\n"
		"The application sets the device:\n"
		"         In maintenance for %d seconds.\n"
		"         In service for %d seconds.\n"
		"\n"
		"Usage: %s <in-maintenance-seconds> <in-service-seconds>\n"
		"         In maintenance for <in-maintenance-seconds> seconds.\n"
		"         In service for <in-service-seconds> seconds.\n"
		"\n", name, MNT_INTERVAL, MNT_INTERVAL, name);

	exit(val);
}

/*
 * sigaction_handler() - Handler to execute after receiving a signal
 *
 * @signum:	Received signal.
 */
static void sigaction_handler(int signum)
{
	log_debug("%s: received signal %d", __func__, signum);

	stop_requested = true;

	exit(0);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	deinit_logger();
}

/*
 * register_signals() - Registers program signals
 */
static void register_signals(void)
{
	struct sigaction new_action;
	struct sigaction old_action;

	atexit(cleanup);

	new_action.sa_handler = sigaction_handler;
	new_action.sa_flags = 0;
	sigemptyset(&new_action.sa_mask);

	sigaction(SIGINT, NULL, &old_action);
	if (old_action.sa_handler != SIG_IGN)
		sigaction(SIGINT, &new_action, NULL);
	
	sigaction(SIGHUP, &old_action, NULL);
	if (old_action.sa_handler != SIG_IGN)
		sigaction(SIGHUP, &new_action, NULL);

	sigaction(SIGTERM, &old_action, NULL);
	if (old_action.sa_handler != SIG_IGN)
		sigaction(SIGTERM, &new_action, NULL);
}

/*
 * wait_loop() - Loop to wait the provided number of seconds
 *
 * @timeout:	Number of seconds to wait.
 */
static void wait_loop(long timeout)
{
	long n_loops, loop;

	n_loops = timeout * 1000 / LOOP_MS;
	for (loop = 0; loop < n_loops; loop++) {
		struct timespec sleepValue = {0};

		if (stop_requested)
			break;
		sleepValue.tv_nsec = LOOP_MS * 1000 * 1000;
		nanosleep(&sleepValue, NULL);
	}
}

int main(int argc, char *argv[])
{
	char *name = basename(argv[0]);
	bool status = false;
	long mnt_sec = MNT_INTERVAL, srv_sec = MNT_INTERVAL;

	init_logger(LOG_INFO, LOG_CONS | LOG_NDELAY | LOG_PID | LOG_PERROR, name);

	if (argc != 1 && argc != 3)
		usage_and_exit(name, EXIT_FAILURE);

	if (argc == 3) {
		char *endptr = NULL;

		mnt_sec = strtol(argv[1], &endptr, 10);
		//log_info("mnt_sec=%ld, strlen(endptr)=%lu", mnt_sec, strlen(endptr));
		if (errno != 0 || mnt_sec < 0 || strlen(endptr))
			goto invalid_values;

		srv_sec = strtol(argv[2], &endptr, 10);
		//log_info("srv_sec=%ld", srv_sec);
		if (errno != 0 || srv_sec < 0 || strlen(endptr))
			goto invalid_values;

		if (mnt_sec == 0 && srv_sec == 0)
			goto invalid_values;
	}

	register_signals();

	if (!cccs_is_daemon_ready(CCCSD_NO_WAIT)) {
		log_error("%s: CCCS daemon not ready... exiting", __func__);

		return EXIT_FAILURE;
	}

	while (!stop_requested) {
		cccs_comm_error_t ret;
		cccs_resp_t resp;
		bool success = false;
		long timeout;

		status = !status;
		timeout = status ? mnt_sec : srv_sec;

		if (timeout == 0)
			continue;

		ret = cccs_set_maintenance_status(status, 3, &resp);
		if (ret != CCCS_SEND_ERROR_NONE) {
			log_error("%s: Unable to set maintenance status", __func__);
		} else if (resp.code != 0) {
			if (resp.hint)
				log_error("%s: Unable to set maintenance status: %s (%d)",
					__func__, resp.hint, resp.code);
			else
				log_error("%s: Unable to set maintenance status: %d",
					__func__, resp.code);
		} else {
			success = true;
		}
		free(resp.hint);

		if (success) {
			if (status) {
				if (mnt_sec == 0 || srv_sec == 0)
					printf("Device IN MAINTENANCE\n");
				else
					printf("Device IN MAINTENANCE for %ld seconds\n", timeout);
				printf("Digi Remote Manager CAN:\n");
				printf("    * Apply compatible configurations\n");
				printf("    * Execute existing automations\n");
			} else {
				if (mnt_sec == 0 || srv_sec == 0)
					printf("Device IN SERVICE\n");
				else
					printf("Device IN SERVICE for %ld seconds\n", timeout);
				printf("Digi Remote Manager CANNOT:\n");
				printf("    * Apply configurations (unless 'allow' is set)\n");
				printf("    * Execute automations (unless 'allow' is set)\n");
			}

			if (mnt_sec == 0 || srv_sec == 0)
				break;
		} else {
			/* Retry the same status */
			status = !status;
		}

		wait_loop(timeout);
	}

	return EXIT_SUCCESS;

invalid_values:
	printf("Invalid time values\n");
	usage_and_exit(name, EXIT_FAILURE);
}
