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

#ifndef AWS_CONFIG_H_
#define AWS_CONFIG_H_

#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define AWS_IOT_CONFIG_FILE	"/etc/awsiotsdk.conf"
#define DEFAULT_CERTS_PATH	"/etc/ssl/certs"

/*------------------------------------------------------------------------------
                 D A T A    T Y P E S    D E F I N I T I O N S
------------------------------------------------------------------------------*/
/**
 * aws_iot_cfg_t - AWS IoT Device SDK configuration type
 *
 * @thing_name:		Thing Name of the Shadow this device is associated with
 * @client_id:		MQTT client ID. It should be unique for every device
 * @host:		MQTT host
 * @port:		Port for MQTT/S
 * @certs_path:		Absolute path to the certificates directory
 * @rootca_fname:	Name of the Root CA file
 * @signed_cert_fname:	Name of the device signed certificate
 * @priv_key_fname:	Name of the device private key
 * @shadow_report_rate:	Frequency at which report system information (seconds)
 * @temp_variation:	Temperature variation between last reported and current
 * 			(C) to report again
 * @cpuload_variation:	CPU load variation between last reported and current (%)
 * 			to report again
 * @led_gpio:		GPIO number of the LED
 */
typedef struct {
	char *thing_name;
	char *client_id;
	char *host;
	int port;
	char *certs_path;
	char *rootca_fname;
	char *signed_cert_fname;
	char *priv_key_fname;
	uint32_t shadow_report_rate;
	uint16_t temp_variation;
	uint16_t cpuload_variation;
	int led_gpio;
} aws_iot_cfg_t;

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
int parse_configuration(const char *const filename, aws_iot_cfg_t *aws_cfg);
void free_configuration(void);

#endif /* AWS_CONFIG_H_ */
