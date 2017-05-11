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

#include <aws_iot_config.h>
#include <aws_iot_log.h>
#include <aws_iot_shadow_interface.h>
#include <limits.h>
#include <string.h>

#include "aws_config.h"
#include "aws_control.h"
#include "device_control.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define MAX_LENGTH_OF_UPDATE_JSON_BUFFER	200

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static void shadow_update_status_callback(const char *pThingName,
					  ShadowActions_t action,
					  Shadow_Ack_Status_t status,
					  const char *pReceivedJsonDocument,
					  void *pContextData);
static void disconnect_callback(AWS_IoT_Client *mqtt_client, void *data);

/*------------------------------------------------------------------------------
                         G L O B A L  V A R I A B L E S
------------------------------------------------------------------------------*/
aws_iot_cfg_t aws_cfg;
device_shadow_t *device_shadow;

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
/*
 * initialize_shadow_client() - Initialize AWS IoT Device SDK
 *
 * @mqtt_client:	MQTT client.
 * @aws_config:		Absolute path of the configuration file to use.
 * 			NULL to use the default one (/etc/awsiotsdk.conf).
 *
 * Return: An IoT error code defining successful/failed initialization.
 */
IoT_Error_t initialize_shadow_client(AWS_IoT_Client *mqtt_client, const char *config_file)
{
	ShadowInitParameters_t shadow_init_params = ShadowInitParametersDefault;
	IoT_Error_t rc = FAILURE;
	char root_ca[PATH_MAX + 1];
	char client_crt[PATH_MAX + 1];
	char client_key[PATH_MAX + 1];

	if (parse_configuration(config_file ? config_file : AWS_IOT_CONFIG_FILE, &aws_cfg) != 0)
		return FAILURE;

	snprintf(root_ca, PATH_MAX + 1, "%s/%s", aws_cfg.certs_path, aws_cfg.rootca_fname);
	snprintf(client_crt, PATH_MAX + 1, "%s/%s", aws_cfg.certs_path, aws_cfg.signed_cert_fname);
	snprintf(client_key, PATH_MAX + 1, "%s/%s", aws_cfg.certs_path, aws_cfg.priv_key_fname);

	IOT_DEBUG("Root CA file: %s", root_ca);
	IOT_DEBUG("Device signed certificate file: %s", client_crt);
	IOT_DEBUG("Device private key file: %s", client_key);

	/* Initialize the MQTT client */
	shadow_init_params.pHost = aws_cfg.host;
	shadow_init_params.port = aws_cfg.port;
	shadow_init_params.pRootCA = root_ca;
	shadow_init_params.pClientCRT = client_crt;
	shadow_init_params.pClientKey = client_key;
	shadow_init_params.enableAutoReconnect = false; /* Enable later */

	IOT_INFO("Initializing MQTT...");
	rc = aws_iot_shadow_init(mqtt_client, &shadow_init_params);
	if (rc != SUCCESS)
		return rc;

	rc = aws_iot_mqtt_set_disconnect_handler(mqtt_client,
						 disconnect_callback, NULL);
	if (rc != SUCCESS) {
		IOT_ERROR("Unable to set MQTT disconnect handler, error: %d",
			  rc);
		return rc;
	}

	/*
	 * Enable Auto Reconnect functionality.
	 * Min and max time of exponential backoff are set in 'aws_iot_config.h':
	 * #AWS_IOT_MQTT_MIN_RECONNECT_WAIT_INTERVAL
	 * #AWS_IOT_MQTT_MAX_RECONNECT_WAIT_INTERVAL
	 */
	rc = aws_iot_shadow_set_autoreconnect_status(mqtt_client, true);
	if (rc != SUCCESS)
		IOT_ERROR("Unable to enable auto-reconnect, error: %d", rc);

	/*
	 * Workaround for shadow updates getting out of sync:
	 *
	 * WARN:  shadow_delta_callback L#504 Old Delta Message received -
	 * Ignoring rx: 40408 local: 40408
	 *
	 * See discussion here:
	 *     https://github.com/aws/aws-iot-device-sdk-embedded-C/issues/32
	 */
	aws_iot_shadow_disable_discard_old_delta_msgs();

	return rc;
}

/**
 * connect_shadow_client() - Establish MQTT connection
 *
 * @mqtt_client:	MQTT client.
 *
 * Return: An IoT error code defining successful/failed connection.
 */
IoT_Error_t connect_shadow_client(AWS_IoT_Client *mqtt_client)
{
	ShadowConnectParameters_t conn_params = ShadowConnectParametersDefault;

	conn_params.pMyThingName = aws_cfg.thing_name;
	conn_params.pMqttClientId = aws_cfg.client_id;
	conn_params.mqttClientIdLen = (uint16_t) strlen(aws_cfg.client_id);
	conn_params.deleteActionHandler = NULL;

	IOT_INFO("Shadow connecting...");
	return aws_iot_shadow_connect(mqtt_client, &conn_params);
}

/**
 * disconnect_shadow_client() - Close MQTT connection
 *
 * @mqtt_client:	MQTT client.
 *
 * Return: An IoT error code defining successful/failed disconnect status.
 */
IoT_Error_t disconnect_shadow_client(AWS_IoT_Client *mqtt_client)
{
	IoT_Error_t rc = FAILURE;

	IOT_INFO("Disconnecting...");

	rc = aws_iot_shadow_disconnect(mqtt_client);

	free_configuration();

	return rc;
}

/*
 * initialize_shadow() - Initialize device Shadow
 *
 * @mqtt_client:	MQTT client.
 * @dev_shadow:		Device shadow.
 *
 * Return: An IoT error code defining successful/failed initialization.
 */
IoT_Error_t initialize_shadow(AWS_IoT_Client *mqtt_client,
			      device_shadow_t *dev_shadow)
{
	device_shadow = dev_shadow;

	device_shadow->temp_handler.cb = NULL;
	device_shadow->temp_handler.pKey = ATTR_TEMPERATURE;
	device_shadow->temp_handler.pData = &(device_shadow->temp);
	device_shadow->temp_handler.type = SHADOW_JSON_DOUBLE;

	device_shadow->temp = 0;
	device_shadow->temp_update = 0;

	device_shadow->cpu_load_handler.cb = NULL;
	device_shadow->cpu_load_handler.pKey = ATTR_CPU_LOAD;
	device_shadow->cpu_load_handler.pData = &(device_shadow->cpu_load);
	device_shadow->cpu_load_handler.type = SHADOW_JSON_DOUBLE;

	device_shadow->cpu_load = 0;
	device_shadow->cpu_load_update = 0;

	device_shadow->aws_config = &aws_cfg;

	return SUCCESS;
}

/**
 * update_shadow() - Update thing shadow.
 *
 * @mqtt_client:	MQTT client.
 *
 * Return: An IoT error code defining successful/failed update action.
 */
IoT_Error_t update_shadow(AWS_IoT_Client *mqtt_client)
{
	char json_doc_buf[MAX_LENGTH_OF_UPDATE_JSON_BUFFER];
	size_t size_json_doc_buf = sizeof(json_doc_buf) / sizeof(json_doc_buf[0]);
	IoT_Error_t rc = FAILURE;

	rc = aws_iot_shadow_init_json_document(json_doc_buf, size_json_doc_buf);
	if (rc != SUCCESS)
		return rc;

	rc = aws_iot_shadow_add_reported(json_doc_buf, size_json_doc_buf,
					 2,
					 &(device_shadow->temp_handler),
					 &(device_shadow->cpu_load_handler));
	if (rc != SUCCESS)
		return rc;

	rc = aws_iot_finalize_json_document(json_doc_buf, size_json_doc_buf);
	if (rc != SUCCESS)
		return rc;

	return aws_iot_shadow_update(mqtt_client, aws_cfg.thing_name,
				     json_doc_buf,
				     shadow_update_status_callback,
				     (void *) device_shadow, 4, true);
}

/**
 * shadow_update_status_callback() - AWS IoT Device SDK update status callback
 *
 * Callback to inform of the response from the AWS IoT Shadow service.
 *
 * @pThingName:		Thing name of the shadow to be updated.
 * @action:		The response of the action.
 * @status:		Update action status: accepted, rejected or time out.
 * @pReceivedJsonDocument: Received JSON document.
 * @pContextData:	Data for the callback. NULL if not used.
 */
static void shadow_update_status_callback(const char *pThingName,
					  ShadowActions_t action,
					  Shadow_Ack_Status_t status,
					  const char *pReceivedJsonDocument,
					  void *pContextData)
{
	device_shadow_t *dev_shadow = NULL;

	IOT_UNUSED(pThingName);
	IOT_UNUSED(pReceivedJsonDocument);

	if (action != SHADOW_UPDATE)
		return;

	dev_shadow = (device_shadow_t *)pContextData;

	switch(status) {
	case SHADOW_ACK_TIMEOUT:
		IOT_INFO("Shadow update timeout");
		break;
	case SHADOW_ACK_REJECTED:
		IOT_INFO("Shadow update rejected");
		break;
	case SHADOW_ACK_ACCEPTED:
		IOT_INFO("Shadow update accepted");
		dev_shadow->temp_update = 0;
		dev_shadow->cpu_load_update = 0;
		break;
	}
}

/**
 * disconnect_callback() - AWS IoT Device SDK disconnect callback
 *
 * It is called whenever the client disconnects with error.
 *
 * @mqtt_client:	MQTT client.
 * @data:		Reference to the data to be passed as argument when
 * 			disconnect handler is called
 */
static void disconnect_callback(AWS_IoT_Client *mqtt_client, void *data)
{
	IoT_Error_t rc = FAILURE;

	IOT_WARN("MQTT Disconnect");

	if (mqtt_client == NULL)
		return;

	IOT_UNUSED(data);

	if (aws_iot_is_autoreconnect_enabled(mqtt_client)) {
		IOT_INFO("Auto-reconnect enabled. Reconnecting attempt will start now");
	} else {
		IOT_WARN("Auto-reconnect not enabled. Starting manual reconnect...");
		rc = aws_iot_mqtt_attempt_reconnect(mqtt_client);
		if (rc == NETWORK_RECONNECTED) {
			IOT_WARN("Manual Reconnect successful");
		} else {
			IOT_WARN("Manual Reconnect failed, error: %d", rc);
		}
	}
}
