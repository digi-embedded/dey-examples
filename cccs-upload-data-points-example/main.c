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
#include <limits.h>
#include <signal.h>
#include <stdlib.h>
#include <unistd.h>

#define STREAM_NAME	"incremental"

#define DP_SLEEP_TIME	6
#define DP_NUMBER	10

static int stop_requested = 0;
static cccs_dp_collection_handle_t dp_collection;

/*
 * destroy_data_stream() - Destroy the data collection with the included data streams
 *
 * @collection:	Data point collection to destroy.
 *
 * Return: 'CCCS_DP_ERROR_NONE' if success, any other value on failure.
 */
static cccs_dp_error_t destroy_data_stream(cccs_dp_collection_handle_t collection)
{
	log_debug("%s", "Destroying data collection");

	return cccs_dp_destroy_collection(collection);
}

/*
 * sigaction_handler() - Handler to execute after receiving a signal
 *
 * @signum:	Received signal.
 */
static void sigaction_handler(int signum)
{
	log_debug("%s: received signal %d", __func__, signum);

	stop_requested = 1;
	/* 'atexit' executes the cleanup function */
	exit(0);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	if (stop_requested)
		destroy_data_stream(dp_collection);

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
 * get_incremental_value() - Retrieves an incremental value each time
 *
 * Return: The new counter value.
 */
static int get_incremental_value(void)
{
	static int counter = -1;

	if (counter == INT_MAX)
		counter = 0;
	else
		counter++;

	log_info("Counter = %d", counter);

	return counter;
}

/*
 * init_data_stream() - Initialize a data point collection
 *
 * @collection:	Data point collection to initialize
 *
 * This function creates a data point collection and adds the 'incremental'
 * data stream to it.
 *
 * Return: 'CCCS_DP_ERROR_NONE' if success, any other value on failure.
 */
static cccs_dp_error_t init_data_stream(cccs_dp_collection_handle_t *collection)
{
	cccs_dp_collection_handle_t c;
	cccs_dp_error_t dp_error;

	dp_error = cccs_dp_create_collection(&c);
	if (dp_error != CCCS_DP_ERROR_NONE) {
		log_error("%s: error %d", __func__, dp_error);

		return dp_error;
	}

	*collection = c;

	dp_error = cccs_dp_add_data_stream_to_collection_extra(c,
			STREAM_NAME, CCCS_DP_KEY_DATA_INT32, true, "counts", NULL);
	if (dp_error != CCCS_DP_ERROR_NONE) {
		log_error("%s: error %d", __func__, dp_error);
		cccs_dp_destroy_collection(c);
		*collection = NULL;
	}

	return dp_error;
}

/*
 * add_incremental_data_point() - Add a new incremental data point to the collection
 *
 * @collection:	Data point collection to add the new data point.
 *
 * Return: 'CCCS_DP_ERROR_NONE' if success, any other value on failure.
 */
static cccs_dp_error_t add_incremental_data_point(cccs_dp_collection_handle_t collection)
{
	cccs_dp_error_t dp_error;

	dp_error = cccs_dp_add(collection, STREAM_NAME, get_incremental_value());
	if (dp_error != CCCS_DP_ERROR_NONE)
		log_error("%s: failed with error: %d", __func__, dp_error);

	return dp_error;
}

/*
 * send_data() - Send collected data to ConnectCore Cloud Services daemon
 *
 * @collection:	Data point collection to with the data to send.
 *
 * Return: 0 if success, any other value on failure.
 */
static int send_data(cccs_dp_collection_handle_t collection)
{
	cccs_comm_error_t ret;
	cccs_resp_t resp;

	log_info("%s", "Sending data stream with new incremental value");

	ret = cccs_send_dp_collection_tout(collection, 5, &resp);
	if (ret != CCCS_SEND_ERROR_NONE) {
		log_error("%s: error sending data points: CCCSD error %d", __func__, ret);
	} else if (resp.code != 0) {
		if (resp.hint)
			log_error("%s: error sending data points: CCCSD error %s (%d)", __func__, resp.hint, resp.code);
		else
			log_error("%s: error sending data points: CCCSD error %d", __func__, resp.code);
	}

	free(resp.hint);

	return ret;
}

int main(int argc, char *argv[])
{
	char *name = basename(argv[0]);
	cccs_dp_error_t dp_error;
	int i;

	init_logger(LOG_DEBUG, LOG_CONS | LOG_NDELAY | LOG_PID | LOG_PERROR, name);

	register_signals();

	if (!cccs_is_daemon_ready(CCCSD_NO_WAIT)) {
		log_error("%s: CCCS daemon not ready... exiting", __func__);

		return EXIT_FAILURE;
	}

	dp_error = init_data_stream(&dp_collection);
	if (dp_error != CCCS_DP_ERROR_NONE) {
		log_error("%s: Cannot initialize data stream, error %d",
			__func__, dp_error);

		return EXIT_FAILURE;
	}

	stop_requested = 0;
	while (!stop_requested) {
		/* Collect DP_NUMBER data points sampled each DP_SLEEP_TIME seconds */
		for (i = 0; i < DP_NUMBER; i++) {
			dp_error = add_incremental_data_point(dp_collection);

			if (dp_error != CCCS_DP_ERROR_NONE) {
				log_error("%s: Cannot add data point, error %d",
					__func__, dp_error);
				i--;
			}

			if (i + 1 < DP_NUMBER)
				sleep(DP_SLEEP_TIME);
		}

		/* Send the block of collected data points */
		send_data(dp_collection);

		if (i == DP_NUMBER)
			sleep(DP_SLEEP_TIME);
	}

	return EXIT_SUCCESS;
}
