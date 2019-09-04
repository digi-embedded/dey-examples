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

#define CPU_SAMPLING_TIME 6
#define MAX_SAMPLES 10
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
		"Example application using libdigiapix power management support. \n"
		"This application enables counter measurements in the CPU and GPU\n"
		"in order to reduce the temperature.\n"
		"\n"
		"Usage: %s [options]\n\n"
		"-c                  Apply CPU counter measurements \n"
		"-g                  Apply GPU counter measurements \n"
		"-b                  Apply CPU & GPU counter measurements \n"
		"\n"
		"Examples:\n"
		"%s -g\n"
		"%s -b\n"
		"\n", name, name, name);

	exit(exitval);
}

/*
 * verify_temperature_reduction() - Print the current temperature during
 * CPU_SAMPLING_TIME * MAX_SAMPLES seconds
 *
 * This function prints the temperature each CPU_SAMPLING_TIME seconds.
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE if something fails.
 */

static int verify_temperature_reduction()
{
	int i, temperature;

	printf("Checking if the temperature is being reduced...\n");
	for (i = 0; i < MAX_SAMPLES; i++) {
		temperature = ldx_cpu_get_current_temp();

		if (temperature == -1) {
			printf("Error getting the temperature\n");
			return EXIT_FAILURE;
		}

		printf("Current temperature: %d \n", temperature);
		sleep(CPU_SAMPLING_TIME);
	}

	return EXIT_SUCCESS;
}

/*
 * apply_countermeasurements() - Apply counter measurements to reduce the temperature
 *
 * @gpu:	1 to enable the gpu counter measurements.
 * @cpu:	1 to enable the cpu counter measurements.
 *
 * This function reduces the GPU multiplier to half of its value if
 * the gpu value is enabled.
 *
 * This function reduces the CPU frequency to the minimum if the cpu value
 * is enabled.
 *
 * Return: EXIT_SUCCESS on success, EXIT_FAILURE if something fails.
 */
static int apply_countermeasurements(int gpu, int cpu)
{
	governor_mode_t governor;
	int freq;
	int ret = EXIT_SUCCESS;
	int gpu_multiplier;

	if (gpu) {
		gpu_multiplier = ldx_gpu_get_multiplier();
		if (gpu_multiplier == -1) {
			printf("Error getting the gpu multiplier, verify that your platform has a GPU\n");
			ret = EXIT_FAILURE;
			goto exit;
		}

		if (ldx_gpu_set_multiplier(gpu_multiplier / 2) == EXIT_FAILURE) {
			printf("Error setting the gpu multiplier to %d\n", gpu_multiplier / 2);
			goto exit;
		}
	}

	if (cpu) {
		governor = ldx_cpu_get_governor();

		if (governor == GOVERNOR_INVALID) {
			printf("Error getting governor\n");
			ret = EXIT_FAILURE;
			goto error;
		}

		/* Only with the 'userspace' governor can we modify and manage the frequency */
		if (ldx_cpu_set_governor(ldx_cpu_get_governor_type_from_string("userspace"))) {
			printf("Error setting the 'userspace' governor\n");
			ret = EXIT_FAILURE;
			goto error;
		}

		freq = ldx_cpu_get_scaling_freq();

		if (freq == -1) {
			printf("Error getting the current frequency, restoring the previous governor\n");
			ret = EXIT_FAILURE;
			goto error;
		}

		if (ldx_cpu_set_scaling_freq(ldx_cpu_get_min_scaling_freq()) == EXIT_FAILURE) {
			printf("Error setting the scaling frequency\n");
			ret = EXIT_FAILURE;
			goto error;
		}
	}

	ret = verify_temperature_reduction();

	if (cpu) {
		/* Restore the frequency */
		if (ldx_cpu_set_scaling_freq(freq)) {
			printf("Error restoring the previous frequency\n");
			ret = EXIT_FAILURE;
		}
	}

error:

	/* Restore CPU parameters */
	if (cpu) {
		if (ldx_cpu_set_governor(governor) == EXIT_FAILURE) {
			printf("Error restoring the governor\n");
			ret = EXIT_FAILURE;
		}
	}

	/* Restore GPU parameters */
	if (gpu) {
		if (ldx_gpu_set_multiplier(gpu_multiplier)){
			printf("Error restoring the gpu multiplier\n");
			ret = EXIT_FAILURE;
		}
	}

exit:

	return ret;
}

int main(int argc, char *argv[])
{
	char *name = basename(argv[0]);
	int opt;
	int cpu = 0;
	int gpu = 0;

	while ((opt = getopt(argc, argv, "gcbh")) > 0) {
		switch (opt) {
		case 'g':
			gpu = 1;
			printf("Applying GPU counter measurements\n");
			break;
		case 'c':
			cpu = 1;
			printf("Applying CPU counter measurements\n");
			break;
		case 'b':
			gpu = 1;
			cpu = 1;
			printf("Applying GPU & CPU counter measurements\n");
			break;
		case 'h':
		default:
			usage_and_exit(name, EXIT_FAILURE);
		}
	}
	if (cpu == 1 || gpu == 1){
		return apply_countermeasurements(gpu, cpu);
	}

	usage_and_exit(name, EXIT_FAILURE);
}
