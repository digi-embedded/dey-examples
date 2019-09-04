/*
 * Copyright 2019, Digi International Inc.
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
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include <libdigiapix/pwr_management.h>

/*
 * usage_and_exit() - Show usage information and exit with 'exitval' return
 *		      value
 *
 * @name:	Application name.
 * @exitval:	The exit code.
 */
static void usage_and_exit(const char *name, int exitval)
{
	printf(
		"Example application using libdigiapix power management support\n"
		"\n"
		"Usage: %s [options]\n\n"
		"-l                  List available frequencies\n"
		"-s <frequency>      Set the desired frequency \n"
		"-v                  Show the current governor\n"
		"-g                  List available governors\n"
		"-f <governor>       Set the desired governor\n"
		"-t                  List the temperatures of the system\n"
		"-c <temperature>    Set the critical temperature in mºC\n"
		"-p <temperature>    Set the passive temperature in mºC\n"
		"-u                  Get the CPU usage\n"
		"-n                  Get the number of CPU cores\n"
		"-d <core_number>    Disable the selected core\n"
		"-e <core_number>    Enable the selected core\n"
		"\n"
		"Examples:\n"
		"%s -l\n"
		"%s -f userspace\n"
		"%s -t\n"
		"\n", name, name, name, name);

	exit(exitval);
}

/*
 * list_available_governors() - Print the available governors
 */
static void list_available_governors()
{
	int i;

	printf("These are the governors available:\n");
	for (i = 0; i < MAX_GOVERNORS; i++) {
		if (ldx_cpu_is_governor_available(i) == EXIT_SUCCESS)
			printf("\t\t\t%s\n", ldx_cpu_get_governor_string_from_type(i));
	}
}

/*
 * list_temperatures() - Print the available temperatures
 */
static void list_temperatures()
{
	printf("Critical temperature %d mºC\n",
		   ldx_cpu_get_critical_trip_point());
	printf("Passive temperature %d mºC\n",
		   ldx_cpu_get_passive_trip_point());
	printf("Current temperature %d mºC\n",
		   ldx_cpu_get_current_temp());
}

/*
 * list_available_frequencies() - Print the available frequencies
 */
static void list_available_frequencies()
{
	int i;
	available_frequencies_t freq = ldx_cpu_get_available_freq();

	printf("These are the available frequencies:\n");
	for (i = 0; i < freq.len; i++) {
		printf("\t\t\t%d\n", freq.data[i]);
	}
	ldx_cpu_free_available_freq(freq);
}

int main(int argc, char *argv[])
{
	char *name = basename(argv[0]);
	const char *governor;
	governor_mode_t governor_mode;
	int ret = EXIT_FAILURE;
	int frequency, temperature, usage, core, opt;

	while ((opt = getopt(argc, argv, "s:f:m:c:d:e:p:gtlunvh ")) > 0) {
		switch (opt) {
		case 'l':
			list_available_frequencies();
			ret = EXIT_SUCCESS;
			break;
		case 's':
			frequency = strtoul(optarg, NULL, 10);
			if (ldx_cpu_set_scaling_freq(frequency) == EXIT_FAILURE) {
				printf("Error setting the scaling frequency to: %d\n", frequency);
			} else {
				ret = EXIT_SUCCESS;
			}
			break;
		case 'g':
			list_available_governors();
			ret = EXIT_SUCCESS;
			break;
		case 'v':
			governor = ldx_cpu_get_governor_string_from_type(ldx_cpu_get_governor());
			if (governor != NULL){
				printf("This is the current governor: %s\n", governor);
				ret = EXIT_SUCCESS;
			} else {
				printf("Unable to get the current governor");
			}
			break;
		case 'f':
			governor_mode = ldx_cpu_get_governor_type_from_string(optarg);
			if (governor_mode == GOVERNOR_INVALID) {
				printf("Invalid governor: %s", optarg);
			} else {
				if (ldx_cpu_set_governor(governor_mode) == EXIT_FAILURE) {
					printf("Unable to set governor: %s\n", optarg);
				} else {
					ret = EXIT_SUCCESS;
				}
			}
			break;
		case 't':
			list_temperatures();
			ret = EXIT_SUCCESS;
			break;
		case 'c':
			temperature = strtoul(optarg, NULL, 10);
			if (ldx_cpu_set_critical_trip_point(temperature) == EXIT_FAILURE) {
				printf("Unable to set the critical trip point temperature: %d\n", temperature);
			} else {
				ret = EXIT_SUCCESS;
			}
			break;
		case 'p':
			temperature = strtoul(optarg, NULL, 10);
			if (ldx_cpu_set_passive_trip_point(temperature) == EXIT_FAILURE)
				printf("Unable to set the passive trip point temperature: %d\n", temperature);
			else
				ret = EXIT_SUCCESS;
			break;
		case 'u':
			usage = ldx_cpu_get_usage();
			if (usage == -1) {
				printf("Error getting the CPU usage\n");
			} else {
				printf("The usage of the CPU is: %d %%\n", usage);
				ret = EXIT_SUCCESS;
			}
			break;
		case 'n':
			core = ldx_cpu_get_number_of_cores();
			if (core == -1) {
				printf("Error getting the number of cores\n");
			} else {
				printf("The number of CPU cores is: %d\n", core);
				ret = EXIT_SUCCESS;
			}
			break;
		case 'd':
			core = strtoul(optarg, NULL, 10);
			printf("Disabling core: %d\n", core);
			if (ldx_cpu_disable_core(core) == EXIT_FAILURE)
				printf("Cannot disable the core with index: %d\n", core);
			else
				ret = EXIT_SUCCESS;
			break;
		case 'e':
			core = strtoul(optarg, NULL, 10);
			printf("Enabling core: %d\n", core);
			if (ldx_cpu_enable_core(core) == EXIT_FAILURE)
				printf("Cannot enable the core with index: %d\n", core);
			else
				ret = EXIT_SUCCESS;
			break;
		case 'h':
		default:
			usage_and_exit(name, EXIT_FAILURE);
		}
	}

	if (ret == EXIT_FAILURE)
		usage_and_exit(name, ret);

	return ret;


}
