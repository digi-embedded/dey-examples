/*
 * Copyright 2017, Digi International Inc.
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

#include <errno.h>
#include <libgen.h>
#include <limits.h>
#include <math.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include "libdigiapix/adc.h"

#define ARG_ADC_CHIP		0
#define ARG_ADC_CHANNEL		1

static adc_t *adc;

struct adc_sampling_cb_data {
	adc_t *adc;
	int total_value;
	int total_value_rms;
	int number_of_samples;
};

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
		"Example application using libdigiapix ADC support\n"
		"\n"
		"Usage: %s <adc_chip> <adc_channel> <interval> <number_of_samples> \n\n"
		"<adc_chip>           ADC chip number\n"
		"<adc_channel>        ADC channel number\n"
		"<interval>           Time interval for sampling\n"
		"<number_of_samples>  Number of samples to get\n"
		"\n\n"
		"\n", name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	/* Free adc */
	ldx_adc_stop_sampling(adc);
	ldx_adc_free(adc);
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

/*
 * parse_argument() - Parses the given string argument and returns the
 *			corresponding integer value
 *
 * @argv:	Argument to parse in string format.
 * @arg_type:	Type of the argument to parse.
 *
 * Return: The parsed integer argument, -1 on error.
 */
static int parse_argument(char *argv, int arg_type)
{
	char *endptr;
	long value;

	errno = 0;
	value = strtol(argv, &endptr, 10);

	if ((errno == ERANGE && (value == LONG_MAX || value == LONG_MIN))
			  || (errno != 0 && value == 0))
		return -1;

	if (endptr == argv) {
		switch (arg_type) {
		case ARG_ADC_CHIP:
			return ldx_adc_get_chip(endptr);
		case ARG_ADC_CHANNEL:
			return ldx_adc_get_channel(endptr);
		default:
			return -1;
		}
	}

	return value;
}

/*
 * adc_sampling_cb() - ADC callback for sampling
 *
 * @arg:	ADC sampling data (struct adc_sampling_cb_data).
 * @sample:	The ADC read sample.
 */
static int adc_sampling_cb(int sample, void *arg)
{
	struct adc_sampling_cb_data *data = arg;
	float sample_mv = 0;

	data->total_value += sample;
	data->total_value_rms += powf(sample, 2);
	data->number_of_samples--;
	sample_mv = ldx_adc_convert_sample_to_mv(data->adc, sample);

	printf("ADC sample acquired: %d (raw) - %2.f (mV)\n", sample, sample_mv);

	return EXIT_SUCCESS;
}

int main(int argc, char *argv[])
{
	unsigned int channel, chip, interval;
	int number_of_samples;
	char *name = basename(argv[0]);
	struct adc_sampling_cb_data cb_data;

	/* Check input parameters */
	if (argc != 5) {
		usage_and_exit(name, EXIT_FAILURE);
		return EXIT_FAILURE;
	}

	/* Parse command line arguments */
	chip = parse_argument(argv[1], ARG_ADC_CHIP);
	channel = parse_argument(argv[2], ARG_ADC_CHANNEL);
	interval = atoi(argv[3]);
	number_of_samples = atoi(argv[4]);

	if (chip < 0) {
		printf("Invalid chip number\n");
		return EXIT_FAILURE;
	}

	if (channel < 0) {
		printf("Invalid channel number\n");
		return EXIT_FAILURE;
	}

	if (interval <= 0) {
		printf("Time interval must be greater than 0\n");
		return EXIT_FAILURE;
	}

	if (number_of_samples <= 0) {
		printf("Number of samples must be greater than 0\n");
		return EXIT_FAILURE;
	}

	cb_data.number_of_samples = number_of_samples;
	cb_data.total_value = 0;
	cb_data.total_value_rms = 0;

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	adc = ldx_adc_request(chip,channel);

	if (!adc) {
		printf("Failed to initialize ADC\n");
		return EXIT_FAILURE;
	}

	cb_data.adc = adc;

	if (ldx_adc_start_sampling(adc, &adc_sampling_cb, interval, &cb_data)) {
		printf("Failed to initialize the sampling data\n");
		return EXIT_FAILURE;
	}

	while (cb_data.number_of_samples > 0) {
		printf("Waiting for samples, %d samples remaining\n",
				cb_data.number_of_samples);
		sleep(1);
	}

	printf("The mean value of the samples is: %d mV\n",
			cb_data.total_value/number_of_samples);
	printf("The RMS value of the samples is: %.2f mV\n",
			sqrt(cb_data.total_value_rms/number_of_samples));

	return EXIT_SUCCESS;
}
