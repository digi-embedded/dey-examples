/*
 * Copyright 2018, Digi International Inc.
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
#include <string.h>
#include <unistd.h>

#include <libdigiapix/can.h>

#define MAX_RECEPTION_BUFFER	512*1024

static can_if_t *can_if;
static struct can_filter *cfilter;
static struct can_filter *canfilter;
static bool running = true;
static bool prn_msg_info = false;
static bool prn_msg_count = false;

/*
 * usage_and_exit() - Show usage information and exit with 'exitval' return
 *		      value
 *
 * @name:	Application name.
 * @exitval:	The exit code.
 */
static void usage_and_exit(char *name, int exitval)
{
	printf(
		"Example application using libdigiapix CAN support\n"
		"\n"
		"Usage: %s -i <can-iface> -b <bitrate> [options]\n\n"
		"-i <can-iface>      Name of the CAN interface\n"
		"-b <bitrate>        Bitrate to use (Hz)\n"
		"-s <sample-point>   Bitrate Sample Point\n"
		"-f <filters>        Comma-separated filter list in the format\n"
		"                    id:mask (id and mask values in hex)\n"
		"-o                  Enable CAN FD support\n"
		"--- CAN FD options ---\n"
		"  -d <dbitrate>      Maximum data bitrate for CAN FD (Hz)\n"
		"  -a <dsample-point> CAN FD data bitate sample point\n"
		"---\n"
		"-p                  Print message info\n"
		"-c                  Print message counter\n"
		"-h                  Help\n"
		"\n"
		"Examples:\n"
		"%s -i can0 -b 500000 -f 023:fff,006:00f\n"
		"%s -i can1 -b 100000\n"
		"%s -i can1 -b 100000 -d 100000 -o -p\n"
		"\n", name, name, name, name);

	exit(exitval);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
	if (canfilter)
		free(canfilter);

	if (can_if) {
		ldx_can_stop(can_if);
		ldx_can_free(can_if);
		running = false;
	}
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

static void can_rx_callback(struct canfd_frame *frame, struct timeval *tv)
{
	static uint32_t nframe = 1;

	if (prn_msg_count) {
		printf("CAN frame       %u\n", nframe);
	} else {
		printf("CAN frame\n");
	}

	if (prn_msg_info) {
		printf(
			" - Time:        %ld.%06ld\n"
			" - Type:        %s\n"
			" - ID:          %x\n"
			" - Data length: %u\n"
			" - Data:        %02x:%02x:%02x:%02x:%02x:%02x:%02x:%02x\n"
			"\n",
			tv->tv_sec, tv->tv_usec, ldx_can_is_extid_frame(frame) ?
			"Extended ID" : "Standard ID", ldx_can_get_id(frame), frame->len,
			frame->data[0], frame->data[1], frame->data[2], frame->data[3],
			frame->data[4], frame->data[5], frame->data[6], frame->data[7]);
	}

	nframe++;
}

static int strchartimes(const char *str, int c)
{
	int count = 0;
	char *character;

	for (character = (char *)str;
		 character && *character != '\0';
		 character++) {
		if (*character == c)
			count++;
	}

	return count;
}

/*
 * parse_filters() -
 *
 * @str:		String that contains all the filters
 * @cfilter:	Struct that contains the filters
 * @nfilters:	Number of valid filters found on str.
 *
 * Return: 0 on success, error code otherwise.
 */
static int parse_filters(char *str, struct can_filter **cfilter, int *nfilters)
{
	int ret;
	int posible_filters;
	int good_filters = 0;
	char *p = str;

	/* First compute the number of filters */
	posible_filters = strchartimes(str, ',');
	posible_filters++;

	/* Allocate the memory for all the possible filters */
	canfilter = malloc(sizeof(struct can_filter) * posible_filters);
	if (!canfilter) {
		printf("Unable to allocate memory for filters\n");
		return -ENOMEM;
	}

	/* Parse the information for each filter */
	while (posible_filters-- && p) {
		ret = sscanf(p, "%x:%x",
					 &canfilter[good_filters].can_id,
					 &canfilter[good_filters].can_mask);
		if (ret == 2)
			good_filters++;

		p = strchr(p, ',');
		if (p)
			p++;
	}

	*nfilters = good_filters;
	*cfilter = canfilter;

	return EXIT_SUCCESS;
}

int main(int argc, char **argv)
{
	char *name = basename(argv[0]);
	char *iface;
	can_if_cfg_t ifcfg;
	int nfilters = 0;
	int opt;
	int ret;
	float sp = 0.0;
	struct can_filter deffilter;

	deffilter.can_id = 0;
	deffilter.can_mask = 0;

	if (argc <= 3) {
		usage_and_exit(name, EXIT_FAILURE);
	}

	ldx_can_set_defconfig(&ifcfg);

	while ((opt = getopt(argc, argv, "i:b:f:d:s:a:opc")) > 0) {
		switch (opt) {
		case 'i':
			iface = optarg;
			break;

		case 'b':
			ifcfg.bitrate = strtoul(optarg, NULL, 10);
			break;

		case 'd':
			ifcfg.dbitrate = strtoul(optarg, NULL, 10);
			break;

		case 's':
			sp = strtof(optarg, NULL);
			ifcfg.bit_timing.sample_point = (__u32)(sp * 1000);
			break;

		case 'a':
			sp = strtof(optarg, NULL);
			ifcfg.dbit_timing.sample_point = (__u32)(sp * 1000);
			break;

		case 'f':
			ret = parse_filters(optarg, &cfilter, &nfilters);
			if (ret) {
				printf("Unable to parse filter information\n\n");
				usage_and_exit(name, EXIT_FAILURE);
			}
			break;

		case 'o':
			ifcfg.canfd_enabled = true;
			break;

		case 'p':
			prn_msg_info = true;
			break;

		case 'c':
			prn_msg_count = true;
			break;

		case 'h':
			usage_and_exit(name, EXIT_SUCCESS);
			break;

		default:
			usage_and_exit(name, EXIT_FAILURE);
		}
	}

	printf("Requesting CAN interface %s... ", iface);

	can_if = ldx_can_request_by_name(iface);
	if (!can_if) {
		printf("ERROR\n");
		return EXIT_FAILURE;
	}
	printf("OK\n");

	/* Register signals and exit cleanup function */
	atexit(cleanup);
	register_signals();

	/* Increase the buffer reception size */
	ifcfg.rx_buf_len = MAX_RECEPTION_BUFFER;

	printf("Initializing CAN interface... ");
	ret = ldx_can_init(can_if, &ifcfg);
	if (ret) {
		printf("ERROR\n");
		goto error;
	}
	printf("OK\n");

	/*
	 * Configure a callback to process the defined filters, otherwise,
	 * use the default filter.
	 */
	if (nfilters == 0) {
		nfilters = 1;
		cfilter = &deffilter;
	}
	ret = ldx_can_register_rx_handler(can_if, can_rx_callback,
									  cfilter, nfilters);

	if (ret < 0) {
		printf("Failed to register rx msg handler\n");
		goto error;
	}

	while (running) {
		sleep(5);
		printf("Waiting for CAN frames...\n");
	}

error:

	printf("\n\nCan receive frame application has finished\n");

	return ret;
}
