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

#ifndef AWS_CONTROL_H_
#define AWS_CONTROL_H_

#include <aws_iot_mqtt_client.h>
#include <aws_iot_shadow_json.h>

#include "aws_config.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define ATTR_TEMPERATURE			"temperature"
#define ATTR_CPU_LOAD				"cpuLoad"
#define ATTR_LED				"ledON"

#define ON					"ON"
#define OFF					"OFF"

/*------------------------------------------------------------------------------
                 D A T A    T Y P E S    D E F I N I T I O N S
------------------------------------------------------------------------------*/

/**
 * device_shadow_t - Device Shadow type
 *
 * @temp:		Last temperature reported (C)
 * @temp_handler:	Temperature handler
 * @temp_update:	Temperature value locally updated
 * @cpu_load:		Last CPU load reported (%)
 * @cpu_load_handler:	CPU load handler
 * @cpu_load_update:	CPU load value locally updated
 * @led_on:		Last LED value reported
 * @led_actuator:	LED actuator
 * @led_update:		LED value locally updated
 * @update_required:	Update shadow immediately
 * @aws_config:		AWS IoT Decive SDK configuration struct
 */
typedef struct {
	double temp;
	jsonStruct_t temp_handler;
	unsigned int temp_update;
	double cpu_load;
	jsonStruct_t cpu_load_handler;
	unsigned int cpu_load_update;
	bool led_on;
	jsonStruct_t led_actuator;
	unsigned int led_update;
	unsigned int update_required;
	aws_iot_cfg_t *aws_config;
} device_shadow_t;

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
IoT_Error_t initialize_shadow_client(AWS_IoT_Client *mqtt_client, const char *config_file);
IoT_Error_t connect_shadow_client(AWS_IoT_Client *mqtt_client);
IoT_Error_t disconnect_shadow_client(AWS_IoT_Client *mqtt_client);
IoT_Error_t initialize_shadow(AWS_IoT_Client *mqtt_client, device_shadow_t *device_shadow);
IoT_Error_t update_shadow(AWS_IoT_Client *mqtt_client);

#endif /* AWS_CONTROL_H_ */
