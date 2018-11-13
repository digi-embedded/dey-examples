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
#include <time.h>
#include <unistd.h>

#include <libdigiapix/can.h>

#define TX_RETRIES	10

#define RANDOM_ID_BIT				0
#define EXT_ID_BIT					1
#define RTR_BIT						2
#define RANDOM_DLC_BIT				3

#define RANDOM_ID_MASK				0x01
#define EXT_ID_MASK					0x02
#define RTR_BIT_MASK				0x04
#define RANDOM_DLC_MASK				0x08

#define RANDOM_ID(random_id)	(random_id << RANDOM_ID_BIT)
#define EXT_ID(extended_id)		(extended_id << EXT_ID_BIT)
#define RTR(rtr)				(rtr << RTR_BIT)
#define RANDOM_DLC(dlc)			(dlc << RANDOM_DLC_BIT)

static can_if_t *can_if;
static bool running = true;

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
		"-n <num_msgs>       Number of messages to send (default 1)\n"
		"-t <delay>          Inter frame delay in ms (default 100)\n"
		"-I <msg_id>         Message id in hex (default 123)\n"
		"-l <data_length>    Payload length (default 8)\n"
		"-r                  Generate a random ID (will ignore the -I parameter)\n"
		"-p                  Generate a random payload (will ignore the -l parameter)\n"
		"-e                  Use extended id\n"
		"-R                  Set RTR\n"
		"\n"
		"Examples:\n"
		"%s -i can0 -b 500000 -n 100 -R\n"
		"%s -i can1 -b 100000\n"
		"\n", name, name, name);

	exit(exitval);
}

/*
 * ms_sleep() - Wait ms miliseconds
 *
 * ms:		Number of ms to wait.
 */
void ms_sleep(uint32_t ms)
{
	struct timespec ts;

	if (ms < 1000) {
		ts.tv_sec = 0;
		ts.tv_nsec = ms * 1000000;
	} else {
		ts.tv_sec = ms / 1000;
		ts.tv_nsec = (ms % 1000) * 1000000;
	}

	nanosleep(&ts, NULL);
}

/*
 * cleanup() - Frees all the allocated memory before exiting
 */
static void cleanup(void)
{
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

void update_msg(struct canfd_frame *frame, uint32_t id, uint8_t dlc, uint8_t flags)
{
	uint8_t index;

	if (flags & RANDOM_ID_MASK)
		id = rand() % 2047 + 1;

	if (flags & EXT_ID_MASK) {
		frame->can_id = id & CAN_EFF_MASK;
		frame->can_id |= CAN_EFF_FLAG;
	} else {
		frame->can_id = id & CAN_SFF_MASK;
	}

	if (flags & RTR_BIT_MASK)
		frame->can_id |= CAN_RTR_FLAG;

	if (flags & RANDOM_DLC_MASK)
		dlc = rand() % 8 + 1;

	frame->len = dlc;

	/* Currently we just do incremental updates on the payload */
	for (index = 0; index < dlc; index++) {
		frame->data[index] = frame->data[index] + 1;
		if (frame->data[index])
			break;
	}

}

int main(int argc, char **argv)
{
	char *name = basename(argv[0]);
	char *iface;
	can_if_cfg_t ifcfg;
	int opt;
	int ret;
	uint32_t ms_delay = 1;
	uint32_t num_msgs = 1;
	uint32_t msg_id = 0x123;
	uint8_t msg_len = 8;
	uint8_t flags = 0;
	struct canfd_frame frame;

	srand (time(NULL));

	if (argc <= 3) {
		usage_and_exit(name, EXIT_FAILURE);
	}

	ldx_can_set_defconfig(&ifcfg);

	while ((opt = getopt(argc, argv, "i:b:n:t:I:l:erRp")) > 0) {
		switch (opt) {
		case 'i':
			iface = optarg;
			break;

		case 'b':
			ifcfg.bitrate = strtoul(optarg, NULL, 10);
			break;

		case 'n':
			num_msgs = strtoul(optarg, NULL, 10);
			break;

		case 't':
			ms_delay = strtoul(optarg, NULL, 10);
			break;

		case 'I':
			msg_id = strtoul(optarg, NULL, 16);
			break;

		case 'l':
			msg_len = strtoul(optarg, NULL, 10);
			break;

		case 'e':
			flags |= EXT_ID_MASK;
			break;

		case 'r':
			flags |= RANDOM_ID_MASK;
			break;

		case 'R':
			flags |= RTR_BIT_MASK;
			break;

		case 'p':
			flags |= RANDOM_DLC_MASK;
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

	printf("Initializing CAN interface... ");
	ret = ldx_can_init(can_if, &ifcfg);
	if (ret) {
		printf("ERROR\n");
		goto error;
	}
	printf("OK\n");

	memset(&frame, 0, sizeof(frame));

	while (running && num_msgs) {
		int retries = TX_RETRIES;
		/* If we need to create more configuration bits, we have this variable flags*/
		update_msg(&frame, msg_id, msg_len, flags);

		while (retries--) {
			ret = ldx_can_tx_frame(can_if, &frame);
			if (!ret) {
				break;
			} else if (ret == -CAN_ERROR_TX_RETRY_LATER) {
				ms_sleep(1);
			} else {
				printf("Failed to send CAN frame (%d)\n", ret);
				goto error;
			}
		}

		if (!retries) {
			printf("Failed to send CAN frame after %d tries\n", ret);
			goto error;
		}

		num_msgs--;

		if (ms_delay)
			ms_sleep(ms_delay);
	}

	ms_sleep(1000);

error:

	printf("\n\nCan send frame application has finished\n");

	return ret;
}
