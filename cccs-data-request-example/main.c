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
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <unistd.h>

#if !(defined UNUSED_ARGUMENT)
#define UNUSED_ARGUMENT(a)	(void)(a)
#endif

#define TARGET_GET_TIME		"get_time"

/*
 * sigaction_handler() - Handler to execute after receiving a signal
 *
 * @signum:	Received signal.
 */
static void sigaction_handler(int signum)
{
	log_debug("%s: received signal %d", __func__, signum);

	exit(0);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	cccs_resp_t resp;
	cccs_comm_error_t ret;

	ret = cccs_remove_request_target(TARGET_GET_TIME, &resp);
	if (ret != CCCS_SEND_ERROR_NONE) {
		log_error("%s: Cannot unregister target '%s': CCCSD error %d",
			__func__, TARGET_GET_TIME, ret);
	} else if (resp.code != 0) {
		if (resp.hint)
			log_error("%s: Cannot unregister target '%s': CCCSD error, %s (%d)",
				__func__, TARGET_GET_TIME, resp.hint, resp.code);
		else
			log_error("%s: Cannot unregister target '%s': CCCSD error, %d",
				__func__, TARGET_GET_TIME, resp.code);
	}

	free(resp.hint);

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
 * get_time_cb() - Data callback for 'get_time' data requests
 *
 * @target:		Target ID of the data request (get_time).
 * @req_buf_info:	Buffer containing the data request.
 * @resp_buf_info:	Buffer to store the answer of the request.
 *
 * Logs information about the received request and executes the corresponding
 * command.
 *
 * Return: 'CCCS_RECEIVE_ERROR_NONE' if success, any other value on failure.
 */
static cccs_receive_error_t get_time_cb(char const *const target,
				cccs_buffer_info_t const *const req_buf_info,
				cccs_buffer_info_t *const resp_buf_info)
{
	time_t t = time(NULL);
	char *time_str = ctime(&t);

	UNUSED_ARGUMENT(req_buf_info);
	log_debug("%s: target='%s'", __func__, target);

	resp_buf_info->length = snprintf(NULL, 0, "Time: %s", time_str);
	resp_buf_info->buffer = calloc(resp_buf_info->length + 1, sizeof(char));
	if (resp_buf_info->buffer == NULL) {
		log_error("%s: resp_buf_info calloc error", __func__);

		return CCCS_RECEIVE_ERROR_INSUFFICIENT_MEMORY;
	}

	resp_buf_info->length = sprintf(resp_buf_info->buffer, "Time: %s", time_str);

	return CCCS_RECEIVE_ERROR_NONE;
}

/*
 * get_time_status_cb() - Status callback for 'get_time' data requests
 *
 * @target:		Target ID of the data request (get_time)
 * @resp_buf_info:	Buffer containing the response data.
 * @receive_error:	The error status of the receive process.
 * @receive_error_hint:	The error hint from the connector service.
 *
 * This callback is executed when the response process has finished. It doesn't
 * matter if everything worked or there was an error during the process.
 *
 * Cleans and frees the response buffer.
 */
static void get_time_status_cb(char const *const target,
			cccs_buffer_info_t *const resp_buf_info,
			int receive_error,
			const char *const receive_error_hint)
{
	log_debug("%s: target='%s' - error='%d' - error-hint='%s'",
		  __func__, target, receive_error, receive_error_hint);

	/* Free the response buffer */
	if (resp_buf_info != NULL)
		free(resp_buf_info->buffer);
}

/*
 * Use the following SCI request to test this example (insert your Device ID):
 *
 * <sci_request version="1.0">
 *   <data_service>
 *     <targets>
 *       <device id="00000000-00000000-XXXXXXXX-XXXXXXXX"/>
 *     </targets>
 *     <requests>
 *       <device_request target_name="get_time"/>
 *     </requests>
 *   </data_service>
 * </sci_request>
 *
 */

int main(int argc, char *argv[])
{
	cccs_comm_error_t ret;
	char *name = basename(argv[0]);
	cccs_resp_t resp;
	int read_char;

	init_logger(LOG_DEBUG, LOG_CONS | LOG_NDELAY | LOG_PID | LOG_PERROR, name);

	register_signals();

	if (!cccs_is_daemon_ready(CCCSD_NO_WAIT)) {
		log_error("%s: CCCS daemon not ready... exiting", __func__);

		return EXIT_FAILURE;
	}

	ret = cccs_add_request_target(TARGET_GET_TIME, get_time_cb,
			get_time_status_cb, &resp);
	if (ret != CCCS_SEND_ERROR_NONE) {
		log_error("%s: Cannot register target '%s': CCCSD error %d",
			__func__, TARGET_GET_TIME, ret);

		return EXIT_FAILURE;
	} else if (resp.code != 0) {
		if (resp.hint)
			log_error("%s: Cannot register target '%s': CCCSD error, %s (%d)",
				__func__, TARGET_GET_TIME, resp.hint, resp.code);
		else
			log_error("%s: Cannot register target '%s': CCCSD error, %d",
				__func__, TARGET_GET_TIME, resp.code);

		return EXIT_FAILURE;
	}

	free(resp.hint);

	printf("Waiting for Remote Manager request...\n");
	printf("Press 'q' and 'Enter' to exit\n");
	do {
		read_char = getchar();
	} while (read_char != 'q');

	return EXIT_SUCCESS;
}
