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
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

#include "libdigiapix/adc.h"

#define ARG_ADC_CHIP			0
#define ARG_ADC_CHANNEL			1

#define DEFAULT_ADC_ALIAS		"DEFAULT_ADC"
#define DEFAULT_TIME_INTERVAl		1
#define DEFAULT_NUMBER_OF_SAMPLES	10

struct adc_sampling_cb_data {
	adc_t *adc;
	int number_of_samples;
};

static adc_t *adc;
struct adc_sampling_cb_data cb_data;

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
		"<adc_chip>           ADC chip number or alias\n"
		"<adc_channel>        ADC channel number or alias\n"
		"<interval>           Time interval for sampling\n"
		"<number_of_samples>  Number of samples to get\n"
		"\n"
		"Alias for ADC can be configured in the library config file\n"
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

	data->number_of_samples--;
	sample_mv = ldx_adc_convert_sample_to_mv(data->adc, sample);

	printf("ADC sample acquired: %d (raw) - %2.f (mV)\n", sample, sample_mv);

	return EXIT_SUCCESS;
}

int main(int argc, char *argv[])
{
	int channel = 0, chip = 0, interval = 0, number_of_samples = 0;
	char *name = basename(argv[0]);

	/* Check input parameters */
	if (argc == 1) {
		/* Use default values */
		chip = ldx_adc_get_chip(DEFAULT_ADC_ALIAS);
		channel = ldx_adc_get_channel(DEFAULT_ADC_ALIAS);
		interval = DEFAULT_TIME_INTERVAl;
		number_of_samples = DEFAULT_NUMBER_OF_SAMPLES;
	} else if (argc == 5) {
		/* Parse command line arguments */
		chip = parse_argument(argv[1], ARG_ADC_CHIP);
		channel = parse_argument(argv[2], ARG_ADC_CHANNEL);
		interval = atoi(argv[3]);
		number_of_samples = atoi(argv[4]);
	} else {
		usage_and_exit(name, EXIT_FAILURE);
	}

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

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	adc = ldx_adc_request(chip, channel);

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

	return EXIT_SUCCESS;
}
