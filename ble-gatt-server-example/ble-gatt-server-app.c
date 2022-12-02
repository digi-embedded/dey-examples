/*
 *  BlueZ - Bluetooth protocol stack for Linux
 *
 *  Copyright (C) 2014  Google Inc.
 *  Copyright (C) 2019  Digi International Inc.
 *
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 */

#define _GNU_SOURCE  /* for asprintf */

#include <ctype.h>
#include <getopt.h>
#include <stdio.h>
#include <stdlib.h>
#include <syslog.h>
#include <sys/wait.h>
#include <unistd.h>

#include "bluetooth/bluetooth.h"
#include "bluetooth/hci.h"
#include "bluetooth/hci_lib.h"
#include "bluetooth/l2cap.h"

#include "bluetooth-internal/uuid.h"
#include "bluetooth-internal/mainloop.h"
#include "bluetooth-internal/util.h"
#include "bluetooth-internal/att.h"
#include "bluetooth-internal/queue.h"
#include "bluetooth-internal/timeout.h"
#include "bluetooth-internal/gatt-db.h"
#include "bluetooth-internal/gatt-server.h"

#include "subprocess.h"
#include "ble-gatt-server-app.h"


#define ATT_CID 4
#define NOTIFICATION_TIMEOUT_MS	1000
#define ARRAY_SIZE(arr) (sizeof(arr) / sizeof((arr)[0]))

static bool verbose = false;
static bool keep_running = true;
static int temp_threshold = 50;

struct server {
	int fd;
	struct bt_att *att;
	struct gatt_db *db;
	struct bt_gatt_server *gatt;
	bool svc_chngd_enabled;
	uint16_t cell_handle;
	int *timeout_handlers;
	int n_characteristics;
};

struct notify_cb_t {
	uint16_t handle;
	struct server *server;
};

void destroy_notify_data(void *user_data)
{
	free(user_data);
}

static char *get_cmd_output(char *cmd)
{
	FILE *in;
	char buff[512], *pbuf = NULL;
	int ret_value;

	in = popen(cmd, "r");
	if (!in) {
		syslog(LOG_WARNING, "execution of cmd '%s' failed\n", cmd);
		return NULL;
	}

	pbuf = fgets(buff, ARRAY_SIZE(buff), in);
	if (pbuf)
		buff[strlen(buff) - 1] = '\0';

	ret_value = pclose(in);

	syslog(LOG_DEBUG, "cmd '%s' returned: '%s' (return value: %d)\n", cmd, buff, ret_value);
	if (pbuf)
		return strdup(buff);

	return pbuf;
}

static void debug_cb(const char *str, void *user_data)
{
	const char *prefix = user_data;

	syslog(LOG_DEBUG ,"%s%s\n", prefix, str);
}

static void att_disconnect_cb(int err, void *user_data)
{
	printf("Device disconnected: %s\n", strerror(err));

	mainloop_quit();
}

static void confirm_write(struct gatt_db_attribute *attr, int err,
			  void *user_data)
{
	if (!err)
		return;

	syslog(LOG_DEBUG, "Error caching attribute %p - err: %d\n", attr, err);
}


/* Generic Access Service (GAP) */

static void gap_device_name_read_cb(struct gatt_db_attribute *attrib,
                                    unsigned int id, uint16_t offset,
                                    uint8_t opcode, struct bt_att *att,
                                    void *user_data)
{
	uint8_t error = 0;
	size_t len = 0;
	uint8_t *value = NULL;
	char *name = NULL;

	name = get_cmd_output("cat /etc/hostname");
	if (!name) {
		error = BT_ATT_ERROR_INVALID_HANDLE;
		goto done;
	}

	len = strlen(name) + 1;
	if (offset > len) {
		error = BT_ATT_ERROR_INVALID_HANDLE;
		goto done;
	}

	len -= offset;
	value = len ? (uint8_t *)&name[offset] : NULL;

done:
	syslog(LOG_DEBUG, "%s called, return: %s (error: 0x%x)\n", __func__, value, error);
	gatt_db_attribute_read_result(attrib, id, error, value, len);
	free(name);
}

static void populate_gap_service(struct server *server)
{
	bt_uuid_t uuid;
	struct gatt_db_attribute *service, *tmp;
	uint16_t appearance;

	/* Add the GAP service */
	bt_uuid16_create(&uuid, UUID_GAP_SERVICE);
	service = gatt_db_add_service(server->db, &uuid, true, 6);

	/*
	 * Device Name characteristic. Make the value dynamically read and
	 * written via callbacks.
	 */
	bt_uuid16_create(&uuid, GATT_CHARAC_DEVICE_NAME);
	gatt_db_service_add_characteristic(service, &uuid,
                                           BT_ATT_PERM_READ,
                                           BT_GATT_CHRC_PROP_READ |
                                           BT_GATT_CHRC_PROP_EXT_PROP,
                                           gap_device_name_read_cb,
                                           NULL,
                                           server);

	bt_uuid16_create(&uuid, GATT_CHARAC_EXT_PROPER_UUID);

	/*
	 * Device Appearance characteristic. Reads and writes should obtain the
	 * value from the database.
	 */
	bt_uuid16_create(&uuid, GATT_CHARAC_APPEARANCE);
	tmp = gatt_db_service_add_characteristic(service, &uuid,
                                                 BT_ATT_PERM_READ,
                                                 BT_GATT_CHRC_PROP_READ,
                                                 NULL, NULL, server);

	/*
	 * Write the appearance value to the database, since we're not using a
	 * callback.
	 */
	put_le16(128, &appearance);
	gatt_db_attribute_write(tmp, 0, (void *) &appearance,
                                sizeof(appearance),
                                BT_ATT_OP_WRITE_REQ,
                                NULL, confirm_write,
                                NULL);

	gatt_db_service_set_active(service, true);
}


/* Generic Attribute Profile Service (GATT) */

static void gatt_service_changed_cb(struct gatt_db_attribute *attrib,
                                    unsigned int id, uint16_t offset,
                                    uint8_t opcode, struct bt_att *att,
                                    void *user_data)
{
	uint8_t error = 0;

	syslog(LOG_DEBUG, "Service Changed Read called\n");

	gatt_db_attribute_read_result(attrib, id, error, NULL, 0);
}

static void gatt_svc_chngd_ccc_read_cb(struct gatt_db_attribute *attrib,
                                       unsigned int id, uint16_t offset,
                                       uint8_t opcode, struct bt_att *att,
                                       void *user_data)
{
	struct server *server = user_data;
	uint8_t error = 0;
	uint8_t value[2];

	syslog(LOG_DEBUG, "Service Changed CCC Read called\n");

	value[0] = server->svc_chngd_enabled ? 0x02 : 0x00;
	value[1] = 0x00;

	gatt_db_attribute_read_result(attrib, id, error, value, sizeof(value));
}

static void gatt_svc_chngd_ccc_write_cb(struct gatt_db_attribute *attrib,
                                        unsigned int id, uint16_t offset,
                                        const uint8_t *value, size_t len,
                                        uint8_t opcode, struct bt_att *att,
                                        void *user_data)
{
	struct server *server = user_data;
	uint8_t error = 0;

	syslog(LOG_DEBUG, "Service Changed CCC Write called\n");

	if (!value || len != 2) {
		error = BT_ATT_ERROR_INVALID_ATTRIBUTE_VALUE_LEN;
		goto done;
	}

	if (offset) {
		error = BT_ATT_ERROR_INVALID_OFFSET;
		goto done;
	}

	if (value[0] == 0x00)
		server->svc_chngd_enabled = false;
	else if (value[0] == 0x02)
		server->svc_chngd_enabled = true;
	else
		error = BT_ATT_ERROR_INVALID_HANDLE;

	syslog(LOG_DEBUG, "Service Changed Enabled: %s\n",
				server->svc_chngd_enabled ? "true" : "false");

done:
	gatt_db_attribute_write_result(attrib, id, error);
}

static void populate_gatt_service(struct server *server)
{
	bt_uuid_t uuid;
	struct gatt_db_attribute *service, *svc_chngd;

	/* Add the GATT service */
	bt_uuid16_create(&uuid, UUID_GATT_SERVICE);
	service = gatt_db_add_service(server->db, &uuid, true, 4);

	bt_uuid16_create(&uuid, GATT_CHARAC_SERVICE_CHANGED);
	svc_chngd = gatt_db_service_add_characteristic(service, &uuid,
                                                       BT_ATT_PERM_READ,
                                                       BT_GATT_CHRC_PROP_READ | BT_GATT_CHRC_PROP_INDICATE,
                                                       gatt_service_changed_cb,
                                                       NULL, server);
	gatt_db_attribute_get_handle(svc_chngd);

	bt_uuid16_create(&uuid, GATT_CLIENT_CHARAC_CFG_UUID);
	gatt_db_service_add_descriptor(service, &uuid,
                                       BT_ATT_PERM_READ | BT_ATT_PERM_WRITE,
                                       gatt_svc_chngd_ccc_read_cb,
                                       gatt_svc_chngd_ccc_write_cb, server);

	gatt_db_service_set_active(service, true);
}


/* Device Information Service */

static void temperature_read_cb(struct gatt_db_attribute *attrib,
                                       unsigned int id, uint16_t offset,
                                       uint8_t opcode, struct bt_att *att,
                                       void *user_data)
{
	uint8_t error = 0;
	size_t len = 0;
	uint8_t *value = NULL;
	int degrees;
	char *temp = NULL;

	temp = get_cmd_output("cat /sys/devices/virtual/thermal/thermal_zone0/temp");
	if (!temp) {
		error = BT_ATT_ERROR_INVALID_HANDLE;
		goto done;
	}

	degrees = atoi(temp)/1000;
	value = (uint8_t *) &degrees;
	len = 1;

done:
	syslog(LOG_DEBUG, "%s called, return: %s (error: 0x%x)\n", __func__, value, error);
	gatt_db_attribute_read_result(attrib, id, error, value, len);
	free(temp);
}

static bool temperature_notify_cb(void *user_data)
{
	struct notify_cb_t *notify_data = user_data;
	struct server *server = notify_data->server;
	char *temp = NULL;
	uint8_t notify_value;
	int current_temp = 0;

	temp = get_cmd_output("cat /sys/devices/virtual/thermal/thermal_zone0/temp");
	if (!temp) {
		return false;
	}

	current_temp = atoi(temp)/1000;
	notify_value = (current_temp >= temp_threshold) ? 0x01 : 0x00;
	free(temp);

	/* If the Temperatue is higher than a threshold send notification */
	if (notify_value) {
		printf("Send Temperature notification: %d degrees\n", current_temp);
		bt_gatt_server_send_notification(server->gatt,
                                                 notify_data->handle,
                                                 &notify_value,
                                                 sizeof(notify_value), false);
	}

	return true;
}

static void current_time_read_cb(struct gatt_db_attribute *attrib,
                                 unsigned int id, uint16_t offset,
                                 uint8_t opcode, struct bt_att *att,
                                 void *user_data)
{
	uint8_t error;
	uint8_t *value = NULL;
	size_t len = 0;
	char *timestamp = NULL;

	timestamp = get_cmd_output("date +%s");
	if (!timestamp) {
		error = BT_ATT_ERROR_INVALID_HANDLE;
		goto done;
	}

	len = strlen(timestamp) + 1;
	if (offset > len) {
		error = BT_ATT_ERROR_INVALID_OFFSET;
		goto done;
	}

	len -= offset;
	value = len ? (uint8_t *) &timestamp[offset] : NULL;
	error = 0;

done:
	syslog(LOG_DEBUG, "%s called, return: %s (error: 0x%x)\n", __func__, value, error);
	gatt_db_attribute_read_result(attrib, id, error, value, len);
	free(timestamp);
}

static void current_time_write_cb(struct gatt_db_attribute *attrib,
                                  unsigned int id, uint16_t offset,
                                  const uint8_t *value, size_t len,
                                  uint8_t opcode, struct bt_att *att,
                                  void *user_data)
{
	uint8_t error = 0;
	int status = 0;
	char *new_timestamp = NULL;
	char *cmd = NULL;

	/* Do not allow to partially write the Time (offset must be 0) */
	if (offset) {
		error = BT_ATT_ERROR_INVALID_OFFSET;
		goto done;
	}

	/*
	 * We need to terminate the string, unfortunately 'value' is read only,
	 * so copy it all over.
	 */
	new_timestamp = malloc(len + 1);
	if (!new_timestamp) {
		error = BT_ATT_ERROR_INVALID_HANDLE;
		goto done;
	}
	memcpy(new_timestamp, value, len);
	new_timestamp[len] = '\0';

	if (asprintf(&cmd, "echo %s", new_timestamp) < 0  ||
	    safe_execute(cmd, &status) < 0 || status) {
		syslog(LOG_ERR, "Failed to set Time, error(%d)\n", status);
		error = BT_ATT_ERROR_INVALID_HANDLE;
	}

done:
	syslog(LOG_DEBUG, "%s called, received: %s (error: 0x%x)\n", __func__, new_timestamp, error);
	gatt_db_attribute_write_result(attrib, id, error);
	free(cmd);
	free(new_timestamp);
}


struct {
	uint16_t uuid;
	const char *description;
	const uint8_t *format;
	gatt_db_read_t read_cb;
	gatt_db_write_t write_cb;
	timeout_func_t notify_cb;
} const bt_characteristics[] = {
	{
		UUID_GATT_CHARACTERISTIC_CURRENT_TIME,
		"Time in String format",
		FORMAT_UTF_8,
		current_time_read_cb,
		current_time_write_cb,
		NULL
	},
	{
		UUID_GATT_CHARACTERISTIC_TEMPERATURE_MEASUREMENT,
		"Temperature in Integer format",
		FORMAT_8_BIT_INT,
		temperature_read_cb,
		NULL,
		temperature_notify_cb
	},
};

/*
 * For each characteristic we create 4 handles:
 *   - Characteristic Declaration
 *   - Characteristic Value Declaration
 *   - Descriptor Declaration:
 *       - Characteristic User Description
 *       - Characteristic Presentation Format
 */
#define HANDLES_PER_CHARACTERISTIC 	4

static void populate_device_information_service(struct server *server)
{
	bt_uuid_t uuid;
	struct gatt_db_attribute *service;
	int i,num_handles;

	/* Add Device Information Service */
	server->n_characteristics = ARRAY_SIZE(bt_characteristics);
	bt_uuid16_create(&uuid, UUID_DEVICE_INFORMATION_SERVICE);
	/* Add one handle for the Service Declaration */
	num_handles = (server->n_characteristics * HANDLES_PER_CHARACTERISTIC) + 1;
	service = gatt_db_add_service(server->db, &uuid, true, num_handles);

	server->cell_handle = gatt_db_attribute_get_handle(service);
	server->timeout_handlers = calloc(server->n_characteristics, sizeof(server->timeout_handlers[0]));
	if (!server->timeout_handlers) {
		syslog(LOG_ERR, "Out of memory, calloc failed!");
		exit(2);
	}

	/* Add all characteristics */
	for (i = 0; i < server->n_characteristics; i++) {
		uint32_t permissions = 0;
		uint8_t properties = 0;
		struct gatt_db_attribute *desc_att, *gatt_handle;

		bt_uuid16_create(&uuid, bt_characteristics[i].uuid);

		if (bt_characteristics[i].read_cb)
			properties |= BT_GATT_CHRC_PROP_READ;

		if (bt_characteristics[i].write_cb) {
			properties |= BT_GATT_CHRC_PROP_WRITE;
			permissions |= BT_ATT_PERM_WRITE;
		}

		if (bt_characteristics[i].notify_cb)
			properties |= BT_GATT_CHRC_PROP_NOTIFY;

		permissions |= BT_ATT_PERM_READ;

		/* Characteristic */
		gatt_handle = gatt_db_service_add_characteristic(
                                                service,
                                                &uuid,
                                                permissions,
                                                properties,
                                                bt_characteristics[i].read_cb,
                                                bt_characteristics[i].write_cb,
                                                server);

		/* Characteristic User Description */
		bt_uuid16_create(&uuid, GATT_CHARAC_USER_DESC_UUID);
		desc_att = gatt_db_service_add_descriptor(service,
                                                          &uuid,
                                                          BT_ATT_PERM_READ,
                                                          NULL,
                                                          NULL,
                                                          server);
		gatt_db_attribute_write(desc_att,
                                        0,
                                        (const uint8_t *) bt_characteristics[i].description,
                                        strlen(bt_characteristics[i].description) + 1,
                                        BT_ATT_OP_READ_REQ,
                                        NULL,
                                        confirm_write,
                                        NULL);

		/* Charateristic Presentation Format */
		bt_uuid16_create(&uuid, GATT_CHARAC_FMT_UUID);
		desc_att = gatt_db_service_add_descriptor(service,
                                                          &uuid,
                                                          BT_ATT_PERM_READ,
                                                          NULL,
                                                          NULL,
                                                          server);

		gatt_db_attribute_write(desc_att,
                                        0,
                                        bt_characteristics[i].format,
                                        FORMAT_BYTES,
                                        BT_ATT_OP_READ_REQ,
                                        NULL,
                                        confirm_write,
                                        NULL);

		/* Notification timed function */
		if (bt_characteristics[i].notify_cb) {
			struct notify_cb_t *notify_data = malloc(sizeof(*notify_data));

			if (!notify_data) {
				syslog(LOG_ERR, "Out of memory, calloc failed!");
				exit(2);
			}
			notify_data->server = server;
			notify_data->handle = gatt_db_attribute_get_handle(gatt_handle);

			server->timeout_handlers[i] = timeout_add(NOTIFICATION_TIMEOUT_MS, bt_characteristics[i].notify_cb, notify_data, destroy_notify_data);

			/* Manually call the notify once to cache a first value */
			bt_characteristics[i].notify_cb(notify_data);
		}
	}

	gatt_db_service_set_active(service, true);
}


/* Main program */
static void populate_db(struct server *server)
{
	populate_gap_service(server);
	populate_gatt_service(server);
	populate_device_information_service(server);
}

static struct server *server_create(int fd, uint16_t mtu)
{
	struct server *server;

	server = new0(struct server, 1);
	if (!server) {
		syslog(LOG_ERR, "Failed to allocate memory for server\n");
		return NULL;
	}

	server->att = bt_att_new(fd, false);
	if (!server->att) {
		syslog(LOG_ERR, "Failed to initialze ATT transport layer\n");
		goto fail;
	}

	if (!bt_att_set_close_on_unref(server->att, true)) {
		syslog(LOG_ERR, "Failed to set up ATT transport layer\n");
		goto fail;
	}

	if (!bt_att_register_disconnect(server->att, att_disconnect_cb, NULL,
									NULL)) 	{
		syslog(LOG_ERR, "Failed to set ATT disconnect handler\n");
		goto fail;
	}

	server->fd = fd;
	server->db = gatt_db_new();
	if (!server->db) {
		syslog(LOG_ERR, "Failed to create GATT database\n");
		goto fail;
	}

	server->gatt = bt_gatt_server_new(server->db, server->att, mtu, 0);
	if (!server->gatt) {
		syslog(LOG_ERR, "Failed to create GATT server\n");
		goto fail;
	}

	if (verbose) {
		bt_att_set_debug(server->att, BT_ATT_DEBUG_VERBOSE, debug_cb, "att: ", NULL);
		bt_gatt_server_set_debug(server->gatt, debug_cb,
							"server: ", NULL);
	}

	/* bt_gatt_server already holds a reference */
	populate_db(server);

	return server;

fail:
	gatt_db_unref(server->db);
	bt_att_unref(server->att);
	free(server);

	return NULL;
}

static void server_destroy(struct server *server)
{
	int i;

	for (i = 0; i < server->n_characteristics; i++)
		if (server->timeout_handlers[i])
			timeout_remove(server->timeout_handlers[i]);

	free(server->timeout_handlers);

	bt_gatt_server_unref(server->gatt);
	gatt_db_unref(server->db);
	bt_att_unref(server->att);
	free(server);
}

static void usage(void)
{
	printf("ble-gatt-server-app\n");
	printf("Usage:\n\tble-gatt-server-app [options]\n");

	printf("Options:\n"
		"\t-i, --index <id>\t\tSpecify adapter index, e.g. hci0\n"
		"\t-t, --threshold <temp>\t\tThe temperature threshold to send notification\n"
		"\t-m, --mtu <mtu>\t\t\tThe ATT MTU to use\n"
		"\t-v, --verbose\t\t\tEnable extra logging\n"
		"\t-h, --help\t\t\tDisplay help\n");
}

static struct option main_options[] = {
	{ "index",		1, 0, 'i' },
	{ "threshold",		1, 0, 't' },
	{ "mtu",		1, 0, 'm' },
	{ "verbose",		0, 0, 'v' },
	{ "help",		0, 0, 'h' },
	{ }
};

static int l2cap_le_att_listen_and_accept(bdaddr_t *src, int sec,
							uint8_t src_type)
{
	int sk, nsk;
	struct sockaddr_l2 srcaddr, addr;
	socklen_t optlen;
	struct bt_security btsec;
	char ba[18];

	sk = socket(PF_BLUETOOTH, SOCK_SEQPACKET, BTPROTO_L2CAP);
	if (sk < 0) {
		syslog(LOG_ERR, "Failed to create L2CAP socket");
		return -1;
	}

	/* Set up source address */
	memset(&srcaddr, 0, sizeof(srcaddr));
	srcaddr.l2_family = AF_BLUETOOTH;
	srcaddr.l2_cid = htobs(ATT_CID);
	srcaddr.l2_bdaddr_type = src_type;
	bacpy(&srcaddr.l2_bdaddr, src);

	if (bind(sk, (struct sockaddr *) &srcaddr, sizeof(srcaddr)) < 0) {
		syslog(LOG_ERR, "Failed to bind L2CAP socket");
		goto fail;
	}

	/* Set the security level */
	memset(&btsec, 0, sizeof(btsec));
	btsec.level = sec;
	if (setsockopt(sk, SOL_BLUETOOTH, BT_SECURITY, &btsec,
							sizeof(btsec)) != 0) {
		syslog(LOG_ERR, "Failed to set L2CAP security level\n");
		goto fail;
	}

	if (listen(sk, 10) < 0) {
		syslog(LOG_ERR, "Listening on socket failed");
		goto fail;
	}
	printf("Started listening on ATT channel. Waiting for connections\n");

	memset(&addr, 0, sizeof(addr));
	optlen = sizeof(addr);

	nsk = accept(sk, (struct sockaddr *) &addr, &optlen);
	if (nsk < 0) {
		syslog(LOG_ERR, "Accept failed");
		goto fail;
	}

	ba2str(&addr.l2_bdaddr, ba);
	printf("Connect from %s\n", ba);
	close(sk);

	return nsk;

fail:
	close(sk);
	return -1;
}

static void signal_cb(int signum, void *user_data)
{
	switch (signum) {
	case SIGINT:
	case SIGTERM:
		keep_running = false;
		mainloop_quit();
		break;
	default:
		break;
	}
}

int main(int argc, char *argv[])
{
	const int sec = BT_SECURITY_LOW;
	const uint8_t src_type = BDADDR_LE_PUBLIC;
	int opt;
	bdaddr_t src_addr;
	int dev_id = -1;
	uint16_t mtu = 0;

	setlogmask (LOG_UPTO (LOG_NOTICE));

	while ((opt = getopt_long(argc, argv, "+hvrm:t:i:",
						main_options, NULL)) != -1) {
		switch (opt) {
		case 'h':
			usage();
			return EXIT_SUCCESS;
		case 'v':
			verbose = true;
			setlogmask (LOG_UPTO (LOG_DEBUG));
			break;
		case 'm': {
			int arg;

			arg = atoi(optarg);
			if (arg <= 0) {
				syslog(LOG_ERR, "Invalid MTU: %d\n", arg);
				return EXIT_FAILURE;
			}

			if (arg > UINT16_MAX) {
				syslog(LOG_ERR, "MTU too large: %d\n", arg);
				return EXIT_FAILURE;
			}

			mtu = (uint16_t) arg;
			break;
		}
		case 't': {
			int arg;

			arg = atoi(optarg);
			if (arg <= 0) {
				syslog(LOG_ERR, "Invalid Temperature threshold: %d\n", arg);
				return EXIT_FAILURE;
			}

			if (arg > UINT8_MAX) {
				syslog(LOG_ERR, "Temperature threshold too large: %d\n", arg);
				return EXIT_FAILURE;
			}

			temp_threshold = arg;
			break;
		}
		case 'i':
			dev_id = hci_devid(optarg);
			if (dev_id < 0) {
				syslog(LOG_ERR, "Invalid adapter");
				return EXIT_FAILURE;
			}

			break;
		default:
			syslog(LOG_ERR, "Invalid option: %c\n", opt);
			return EXIT_FAILURE;
		}
	}

	argc -= optind;
	argv -= optind;
	optind = 0;

	openlog("ble-gatt-server-app", LOG_CONS | LOG_PID | LOG_NDELAY, LOG_LOCAL1);
	printf("Running GATT server\n");

	if (argc) {
		usage();
		return EXIT_SUCCESS;
	}

	while (keep_running == true) {
		int fd;
		struct server *server;

		if (dev_id == -1) {
			bacpy(&src_addr, BDADDR_ANY);
		}
		else if (hci_devba(dev_id, &src_addr) < 0) {
			syslog(LOG_ERR, "Adapter not available");
			return EXIT_FAILURE;
		}

		fd = l2cap_le_att_listen_and_accept(&src_addr, sec, src_type);
		if (fd < 0) {
			syslog(LOG_ERR, "Failed to accept L2CAP ATT connection\n");
			return EXIT_FAILURE;
		}

		mainloop_init();

		server = server_create(fd, mtu);
		if (!server) {
			close(fd);
			return EXIT_FAILURE;
		}

		mainloop_run_with_signal(signal_cb, NULL);

		server_destroy(server);

		close(fd);
	}

	return EXIT_SUCCESS;
}
