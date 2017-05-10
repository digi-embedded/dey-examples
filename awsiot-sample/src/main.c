/*
 * Copyright (c) 2017 Digi International Inc.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 *
 * Digi International Inc. 11001 Bren Road East, Minnetonka, MN 55343
 * =======================================================================
 */

#include <aws_iot_log.h>
#include <getopt.h>
#include <libgen.h>
#include <signal.h>
#include <unistd.h>

#include "daemonize.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define VERSION			"0.1" GIT_REVISION

#define USAGE \
	"AWS IoT Device SDK demo.\n" \
	"Copyright(c) Digi International Inc.\n" \
	"\n" \
	"Version: %s\n" \
	"\n" \
	"Usage: %s [options]\n\n" \
	"  -d  --daemon              Daemonize the process\n" \
	"  -h  --help                Print help and exit\n" \
	"\n"

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static int start_aws_iot(const char *config_file);
static int check_stop(void);
static void add_sigkill_signal(void);
static void graceful_shutdown(void);
static void sigint_handler(int signum);
static void usage(char const *const name);

/*------------------------------------------------------------------------------
                         G L O B A L  V A R I A B L E S
------------------------------------------------------------------------------*/
static volatile int stop = 0;

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
int main(int argc, char **argv)
{
	int result = EXIT_SUCCESS;
	char *name = basename(argv[0]);
	static int opt, opt_index;
	int create_daemon = 0;
	char *config_file = NULL;
	static const char *short_options = "dh";
	static const struct option long_options[] = {
			{"daemon", no_argument, NULL, 'd'},
			{"help", no_argument, NULL, 'h'},
			{NULL, 0, NULL, 0}
	};

	while (1) {
		opt = getopt_long(argc, argv, short_options, long_options,
				&opt_index);
		if (opt == -1)
			break;

		switch (opt) {
		case 'd':
			create_daemon = 1;
			break;
		case 'h':
			usage(name);
			goto done;
		default:
			usage(name);
			result = EXIT_FAILURE;
			goto done;
		}
	}

	/* Daemonize if requested. */
	if (create_daemon) {
		if (start_daemon(name) != 0) {
			result = EXIT_FAILURE;
			goto done;
		}
	}

	/* Do the real work. */
	start_aws_iot(config_file);

done:
	return result;
}

/*
 * start_aws_iot() - Start AWS IoT Device SDK
 *
 * @config_file:	Absolute path of the configuration file to use.
 * 			NULL to use the default one (/etc/awsiotsdk.conf).
 *
 * Return: 0 on success, 1 otherwise.
 */
static int start_aws_iot(const char *config_file)
{
	int result = EXIT_SUCCESS;

	add_sigkill_signal();

	do {
		sleep(1);
	} while (!check_stop());

	return result;
}

/*
 * check_stop() - Stop application
 *
 * Return: 1 if it is successfully stopped, 0 otherwise.
 */
static int check_stop(void)
{
	return stop;
}

/*
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

/*
 * graceful_shutdown() - Stop MQTT connection and all threads
 */
void graceful_shutdown(void)
{
	stop = 1;
	check_stop();
}

/**
 * sigint_handler() - Manage signal received.
 *
 * @signum: Received signal.
 */
static void sigint_handler(int signum)
{
	IOT_DEBUG("Received signal %d to close Cloud connection.", signum);
	exit(0);
}

/**
 * usage() - Print usage information
 *
 * @name:	Application name.
 */
static void usage(char const *const name)
{
	printf(USAGE, VERSION, name);
}
