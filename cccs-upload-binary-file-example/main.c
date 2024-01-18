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
#include <libgen.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>

#define STREAM_NAME		"binary_dp"
#define UPLOAD_FILE		"/etc/build"

/*
 * sigaction_handler() - Handler to execute after receiving a signal
 *
 * @signum:	Received signal.
 */
static void sigaction_handler(int signum)
{
	log_debug("%s: received signal %d", __func__, signum);

	/* 'atexit' executes the cleanup function */
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

int main(int argc, char *argv[])
{
	char *name = basename(argv[0]);
	cccs_comm_error_t ret;
	cccs_resp_t resp;

	init_logger(LOG_DEBUG, LOG_CONS | LOG_NDELAY | LOG_PID | LOG_PERROR, name);

	register_signals();

	if (!cccs_is_daemon_ready(CCCSD_NO_WAIT)) {
		log_error("%s: CCCS daemon not ready... exiting", __func__);

		return EXIT_FAILURE;
	}

	log_info("Sending binary file '%s'", UPLOAD_FILE);

	ret = cccs_send_dp_binary_file(UPLOAD_FILE, STREAM_NAME, 5, &resp);
	if (ret != CCCS_SEND_ERROR_NONE) {
		log_error("%s: error sending binary file: CCCSD error %d", __func__, ret);
	} else if (resp.code != 0) {
		if (resp.hint)
			log_error("%s: error sending binary file: CCCSD error %s (%d)", __func__, resp.hint, resp.code);
		else
			log_error("%s: error sending binary file: CCCSD error %d", __func__, resp.code);
	}

	free(resp.hint);

	return EXIT_SUCCESS;
}
