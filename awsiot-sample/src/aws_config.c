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
#include <confuse.h>
#include <dirent.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>

#include "aws_config.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define SETTING_THING_NAME		"thing_name"
#define SETTING_CLIENT_ID		"client_id"
#define SETTING_HOST			"host"
#define SETTING_PORT			"port"
#define SETTING_CERTS_PATH		"certs_path"
#define SETTING_ROOTCA_NAME		"rootca_filename"
#define SETTING_SCERT_NAME		"signed_cert_filename"
#define SETTING_PRIVKEY_NAME		"private_key_filename"
#define SETTING_SHADOW_REPORT_RATE	"shadow_report_rate"
#define SETTING_SHADOW_REPORT_RATE_MIN	1 /* second */
#define SETTING_SHADOW_REPORT_RATE_MAX	(365 * 24 * 60 * 60UL) /* A year */
#define SETTING_TEMP_VARIATION		"temperature_variation"
#define SETTING_TEMP_VARIATION_MIN	0.1 /* C */
#define SETTING_TEMP_VARIATION_MAX	10.0 /* C */
#define SETTING_CPULOAD_VARIATION	"cpu_load_variation"
#define SETTING_CPULOAD_VARIATION_MIN	1 /* % */
#define SETTING_CPULOAD_VARIATION_MAX	50.0 /* % */

#define SETTING_UNKNOWN			"__unknown"

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static int fill_aws_iot_config(aws_iot_cfg_t *aws_cfg);
static int cfg_check_thing_name(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_client_id(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_port(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_certificates_path(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_cert_file(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_shadow_report_rate(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_temp_variation(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_cpuload_variation(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_int_range(cfg_t *cfg, cfg_opt_t *opt, uint32_t min, uint32_t max);
static int cfg_check_float_range(cfg_t *cfg, cfg_opt_t *opt, float min, float max);
static int cfg_check_empty_string(cfg_t *cfg, cfg_opt_t *opt);
static int cfg_check_string_length(cfg_t *cfg, cfg_opt_t *opt, uint16_t min, uint16_t max);
static int file_exists(const char *const filename);
static int file_readable(const char *const filename);

/*------------------------------------------------------------------------------
                         G L O B A L  V A R I A B L E S
------------------------------------------------------------------------------*/
static cfg_t *cfg;

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
/*
 * parse_configuration() - Parse and save the settings of a configuration file
 *
 * @filename:	Name of the file containing the configuration settings.
 * @aws_cfg:	AWS IoT Device SDK configuration struct (aws_iot_cfg_t) where
 * 		the settings parsed from the configuration file are saved.
 *
 * Read the provided configuration file and save the settings in the given
 * aws_iot_cfg_t struct. If the file does not exist or cannot be read, the
 * configuration struct is initialized with the default settings.
 *
 * Return: 0 if the file is parsed successfully, -1 if there is an error
 *         parsing the file.
 */
int parse_configuration(const char *const filename, aws_iot_cfg_t *aws_cfg)
{
	/* Overall structure of the settings. */
	static cfg_opt_t opts[] = {
		/* --------------------------------------------------------------------- */
		/*|   TYPE   |     SETTING NAME     |    DEFAULT VALUE    |    FLAGS    |*/
		/* --------------------------------------------------------------------- */
		CFG_STR		(SETTING_THING_NAME,	AWS_IOT_MY_THING_NAME,	CFGF_NONE),
		CFG_STR		(SETTING_CLIENT_ID,	AWS_IOT_MQTT_CLIENT_ID,	CFGF_NONE),
		CFG_STR		(SETTING_HOST,		AWS_IOT_MQTT_HOST,	CFGF_NONE),
		CFG_INT		(SETTING_PORT,		AWS_IOT_MQTT_PORT,	CFGF_NONE),

		CFG_STR		(SETTING_CERTS_PATH,	DEFAULT_CERTS_PATH,	CFGF_NONE),
		CFG_STR		(SETTING_ROOTCA_NAME,	AWS_IOT_ROOT_CA_FILENAME,CFGF_NONE),
		CFG_STR		(SETTING_SCERT_NAME,	AWS_IOT_CERTIFICATE_FILENAME,CFGF_NONE),
		CFG_STR		(SETTING_PRIVKEY_NAME,	AWS_IOT_PRIVATE_KEY_FILENAME,CFGF_NONE),

		CFG_INT		(SETTING_SHADOW_REPORT_RATE,	60,		CFGF_NONE),
		CFG_FLOAT	(SETTING_TEMP_VARIATION,	1,		CFGF_NONE),
		CFG_FLOAT	(SETTING_CPULOAD_VARIATION,	10,		CFGF_NONE),

		/* Needed for unknown settings. */
		CFG_STR		(SETTING_UNKNOWN,		NULL,		CFGF_NONE),
		CFG_END()
	};

	if (!file_exists(filename)) {
		IOT_ERROR("File '%s' does not exist.", filename);
		return -1;
	}

	if (!file_readable(filename)) {
		IOT_ERROR("File '%s' cannot be read.", filename);
		return -1;
	}

	cfg = cfg_init(opts, CFGF_IGNORE_UNKNOWN);
	cfg_set_validate_func(cfg, SETTING_THING_NAME, cfg_check_thing_name);
	cfg_set_validate_func(cfg, SETTING_CLIENT_ID, cfg_check_client_id);
	cfg_set_validate_func(cfg, SETTING_HOST, cfg_check_empty_string);
	cfg_set_validate_func(cfg, SETTING_PORT, cfg_check_port);
	cfg_set_validate_func(cfg, SETTING_CERTS_PATH, cfg_check_certificates_path);
	cfg_set_validate_func(cfg, SETTING_ROOTCA_NAME, cfg_check_cert_file);
	cfg_set_validate_func(cfg, SETTING_SCERT_NAME, cfg_check_cert_file);
	cfg_set_validate_func(cfg, SETTING_PRIVKEY_NAME, cfg_check_cert_file);
	cfg_set_validate_func(cfg, SETTING_SHADOW_REPORT_RATE, cfg_check_shadow_report_rate);
	cfg_set_validate_func(cfg, SETTING_TEMP_VARIATION, cfg_check_temp_variation);
	cfg_set_validate_func(cfg, SETTING_CPULOAD_VARIATION, cfg_check_cpuload_variation);

	/* Parse the configuration file. */
	switch (cfg_parse(cfg, filename)) {
	case CFG_FILE_ERROR:
		IOT_ERROR("Configuration file '%s' could not be read: %s\n",
			  filename, strerror(errno));
		return -1;
	case CFG_SUCCESS:
		break;
	case CFG_PARSE_ERROR:
		IOT_ERROR("Error parsing configuration file '%s'\n", filename);
		return -1;
	}

	return fill_aws_iot_config(aws_cfg);
}


/*
 * free_configuration() - Release the configuration var
 */
void free_configuration(void)
{
	cfg_free(cfg);
}

/*
 * fill_aws_iot_config() - Fill the AWS IoT Device SDK configuration struct
 *
 * @aws_cfg:	AWS IoT Device SDK configuration struct (aws_iot_cfg_t).
 *
 * Return: 0 if the configuration is filled successfully, -1 otherwise.
 */
static int fill_aws_iot_config(aws_iot_cfg_t *aws_cfg)
{
	aws_cfg->thing_name = cfg_getstr(cfg, SETTING_THING_NAME);
	if (aws_cfg->thing_name == NULL)
		return -1;
	aws_cfg->client_id = cfg_getstr(cfg, SETTING_CLIENT_ID);
	if (aws_cfg->client_id == NULL)
		return -1;
	aws_cfg->host = cfg_getstr(cfg, SETTING_HOST);
	if (aws_cfg->host == NULL)
		return -1;
	aws_cfg->port = cfg_getint(cfg, SETTING_PORT);
	aws_cfg->certs_path = cfg_getstr(cfg, SETTING_CERTS_PATH);
	if (aws_cfg->certs_path == NULL)
		return -1;
	aws_cfg->rootca_fname = cfg_getstr(cfg, SETTING_ROOTCA_NAME);
	if (aws_cfg->rootca_fname == NULL)
		return -1;
	aws_cfg->signed_cert_fname = cfg_getstr(cfg, SETTING_SCERT_NAME);
	if (aws_cfg->signed_cert_fname == NULL)
		return -1;
	aws_cfg->priv_key_fname = cfg_getstr(cfg, SETTING_PRIVKEY_NAME);
	if (aws_cfg->priv_key_fname == NULL)
		return -1;
	aws_cfg->shadow_report_rate = cfg_getint(cfg, SETTING_SHADOW_REPORT_RATE);
	aws_cfg->temp_variation = cfg_getfloat(cfg, SETTING_TEMP_VARIATION);
	aws_cfg->cpuload_variation = cfg_getfloat(cfg, SETTING_CPULOAD_VARIATION);

	return 0;
}

/*
 * cfg_check_thing_name() - Validate thing_name in the configuration file
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_thing_name(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_string_length(cfg, opt, 1, MAX_SIZE_OF_THING_NAME);
}

/*
 * cfg_check_client_id() - Validate client_id in the configuration file
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_client_id(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_string_length(cfg, opt, 1, MAX_SIZE_OF_UNIQUE_CLIENT_ID_BYTES);
}

/*
 * cfg_check_port() - Validate port is between 0 and 65535
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_port(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_int_range(cfg, opt, 0, 65535);
}

/*
 * cfg_check_certificates_path() - Validate certs_path value
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_certificates_path(cfg_t *cfg, cfg_opt_t *opt)
{
	DIR *dir = NULL;
	char *val = cfg_opt_getnstr(opt, 0);

	dir = opendir(val);

	if (dir) {
		closedir(dir);
		return 0;
	} else {
		cfg_error(cfg,
			  "Invalid %s: cannot find directory '%s'",
			  opt->name, val);
		return -1;
	}
}

/*
 * cfg_check_cert_file() - Validate certificate file name value
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_cert_file(cfg_t *cfg, cfg_opt_t *opt)
{
	char *certs_path = NULL;
	char *file_path = NULL;
	char *val = cfg_opt_getnstr(opt, 0);

	if (cfg_check_string_length(cfg, opt, 1, 0) != 0)
		return -1;

	certs_path = cfg_getstr(cfg, SETTING_CERTS_PATH);
	if (certs_path == NULL) {
		cfg_error(cfg, "Invalid %s: NULL value", SETTING_CERTS_PATH);
		return -1;
	}

	file_path = calloc(1, sizeof(*file_path) * (strlen(certs_path) + strlen(val) + 2));
	if (file_path == NULL) {
		cfg_error(cfg,
			  "Error checking %s: unable to allocate memory",
			  opt->name);
		return -1;
	}
	sprintf(file_path, "%s/%s", certs_path, val);

	if (!file_readable(file_path)) {
		cfg_error(cfg,
			  "Invalid %s: cannot find file '%s'", opt->name, val);
		free(file_path);
		return -1;
	}

	free(file_path);
	return 0;
}

/*
 * cfg_check_shadow_report_rate() - Validate shadow report rate value is between
 * 					1s and a year
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_shadow_report_rate(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_int_range(cfg, opt,
				   SETTING_SHADOW_REPORT_RATE_MIN,
				   SETTING_SHADOW_REPORT_RATE_MAX);
}

/*
 * cfg_check_temp_variation() - Validate temperature variation value is between
 * 				0.1 and 10.0
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_temp_variation(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_float_range(cfg, opt,
				     SETTING_TEMP_VARIATION_MIN,
				     SETTING_TEMP_VARIATION_MAX);
}

/*
 * cfg_check_cpuload_variation() - Validate CPU load variation value is between
 * 				0.1 and 50.0
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_cpuload_variation(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_float_range(cfg, opt,
				     SETTING_CPULOAD_VARIATION_MIN,
				     SETTING_CPULOAD_VARIATION_MAX);
}

/*
 * cfg_check_int_range() - Validate a parameter int value is between the given range
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 * @min:	Minimum value of the parameter.
 * @max:	Maximum value of the parameter.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_int_range(cfg_t *cfg, cfg_opt_t *opt, uint32_t min, uint32_t max)
{
	unsigned long val = cfg_opt_getnint(opt, 0);

	if (val > max || val < min) {
		cfg_error(cfg,
			  "Invalid %s (%d): value must be between %d and %d",
			  opt->name, val, min, max);
		return -1;
	}
	return 0;
}

/*
 * cfg_check_float_range() - Validate a parameter float value is between the given range
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 * @min:	Minimum value of the parameter.
 * @max:	Maximum value of the parameter.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_float_range(cfg_t *cfg, cfg_opt_t *opt, float min, float max)
{
	float val = cfg_opt_getnfloat(opt, 0);

	if (val > max || val < min) {
		cfg_error(cfg,
			  "Invalid %s (%f): value must be between %f and %f",
			  opt->name, val, min, max);
		return -1;
	}
	return 0;
}

/*
 * cfg_check_empty_string() - Validate string is empty
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_empty_string(cfg_t *cfg, cfg_opt_t *opt)
{
	return cfg_check_string_length(cfg, opt, 1, 0);
}

/*
 * cfg_check_string_length() - Validate the length of a string is in range
 *
 * @cfg:	The section where the option is defined.
 * @opt:	The option to check.
 * @min: 	The string minimum length.
 * @max:	The string maximum length. 0 to unlimited.
 *
 * @Return: 0 on success, any other value otherwise.
 */
static int cfg_check_string_length(cfg_t *cfg, cfg_opt_t *opt, uint16_t min, uint16_t max)
{
	char *val = cfg_opt_getnstr(opt, 0);

	if ((val == NULL) || ((strlen(val) == 0) && (min > 0))) {
		cfg_error(cfg, "Invalid %s (%s): cannot be empty", opt->name, val);
		return -1;
	}
	if (strlen(val) < min) {
		cfg_error(cfg,
			  "Invalid %s (%s): cannot be shorter than %d character(s)",
			  opt->name, val, min);
		return -1;
	}
	if (max != 0 && strlen(val) > max) {
		cfg_error(cfg,
			  "Invalid %s (%s): cannot be longer than %d character(s)",
			  opt->name, val, max);
		return -1;
	}

	return 0;
}

/**
 * file_exists() - Check that the file with the given name exists
 *
 * @filename:	Full path of the file to check if it exists.
 *
 * Return: 1 if the file exits, 0 if it does not exist.
 */
static int file_exists(const char *const filename)
{
	return access(filename, F_OK) == 0;
}

/**
 * file_readable() - Check that the file with the given name can be read
 *
 * @filename:	Full path of the file to check if it is readable.
 *
 * Return: 1 if the file is readable, 0 if it cannot be read.
 */
static int file_readable(const char *const filename)
{
	return access(filename, R_OK) == 0;
}
