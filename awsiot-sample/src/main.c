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
#include <aws_iot_version.h>
#include <aws_iot_shadow_interface.h>
#include <getopt.h>
#include <libgen.h>
#include <signal.h>
#include <time.h>
#include <unistd.h>

#include "aws_config.h"
#include "aws_control.h"
#include "daemonize.h"
#include "device_control.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define STRINGIFY(x)		#x
#define TOSTRING(x)		STRINGIFY(x)

#define VERSION			"0.1" GIT_REVISION
#define AWS_IOT_VERSION		TOSTRING(VERSION_MAJOR) "." TOSTRING(VERSION_MINOR) "." TOSTRING(VERSION_PATCH) "-" VERSION_TAG

#define USAGE \
	"AWS IoT Device SDK demo.\n" \
	"Copyright(c) Digi International Inc.\n" \
	"\n" \
	"Version: %s\n" \
	"AWS IoT SDK Version: " AWS_IOT_VERSION "\n" \
	"\n" \
	"Usage: %s [options]\n\n" \
	"  -d  --daemon              Daemonize the process\n" \
	"  -c  --config-file=<PATH>  Use a custom configuration file instead of\n" \
	"                            the default one located in " AWS_IOT_CONFIG_FILE "\n" \
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
static AWS_IoT_Client mqtt_client;

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
	static const char *short_options = "dc:h";
	static const struct option long_options[] = {
			{"daemon", no_argument, NULL, 'd'},
			{"config-file", required_argument, NULL, 'c'},
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
		case 'c':
			config_file = optarg;
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
	IoT_Error_t rc = FAILURE;
	device_shadow_t device_shadow;
	time_t time_start;

	add_sigkill_signal();

	rc = initialize_shadow_client(&mqtt_client, config_file);
	if (rc != SUCCESS) {
		IOT_ERROR("Cannot initialize Shadow client, error: %d", rc);
		return rc;
	}

	rc = connect_shadow_client(&mqtt_client);
	if (rc != SUCCESS) {
		IOT_ERROR("Unable to connect, error: %d", rc);
		return rc;
	}

	rc = initialize_shadow(&mqtt_client, &device_shadow);
	if (rc != SUCCESS) {
		IOT_ERROR("Unable to initialize device Shadow, error: %d", rc);
		goto done;
	}

	time_start = time(NULL);
	/* Loop and publish shadow changes */
	while (rc == NETWORK_ATTEMPTING_RECONNECT ||
	       rc == NETWORK_RECONNECTED ||
	       rc == SUCCESS ||
	       !check_stop()) {
		aws_iot_cfg_t *aws_cfg = device_shadow.aws_config;
		double t;
		double load;
		int change_shadow = 0;

		rc = aws_iot_mqtt_yield(&mqtt_client, 200);

		if (rc == NETWORK_ATTEMPTING_RECONNECT) {
			sleep(1);
			/* If the client is attempting to reconnect,
			 * skip the rest of the loop */
			continue;
		}

		t = get_cpu_temp();
		device_shadow.temp_update = (t <= (device_shadow.temp - aws_cfg->temp_variation) ||
					     t >= (device_shadow.temp + aws_cfg->temp_variation));

		load = get_cpu_load();
		device_shadow.cpu_load_update = (load <= (device_shadow.cpu_load - aws_cfg->cpuload_variation) ||
						 load >= (device_shadow.cpu_load + aws_cfg->cpuload_variation));

		change_shadow = device_shadow.temp_update ||
				device_shadow.cpu_load_update;

		if (change_shadow ||
		    (time(NULL) - time_start) >= aws_cfg->shadow_report_rate) {
			device_shadow.temp = t;
			device_shadow.cpu_load = load;

			IOT_INFO("\n=========================================");
			IOT_INFO("Updating shadow...");
			if (device_shadow.temp_update)
				IOT_INFO(
					 "Temperature variation greater than %dC\n",
					 aws_cfg->temp_variation);
			if (device_shadow.cpu_load_update)
				IOT_INFO(
					 "CPU Load variation greater than %d%%\n",
					 aws_cfg->cpuload_variation);
			IOT_INFO("Temperature: %fC", t);
			IOT_INFO("CPU Load: %f%%", load);
			IOT_INFO("=========================================\n");

			rc = update_shadow(&mqtt_client);

			if ((time(NULL) - time_start) >= aws_cfg->shadow_report_rate)
				time_start = time(NULL);
		}

		sleep(1);
	}

done:
	if (rc != SUCCESS) {
		IOT_ERROR("Error occurred in the loop: %d", rc);
		graceful_shutdown();
	}

	return rc;
}

/*
 * check_stop() - Stop application
 *
 * Return: 1 if it is successfully stopped, 0 otherwise.
 */
static int check_stop(void)
{
	if (stop) {
		IoT_Error_t rc = disconnect_shadow_client(&mqtt_client);
		if (rc != SUCCESS) {
			IOT_ERROR("Disconnect error: %d", rc);
			stop = 0;
		}
	}

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
