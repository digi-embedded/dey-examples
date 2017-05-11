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

#include <aws_iot_log.h>
#include <string.h>
#include <unistd.h>

#include "device_control.h"

/*------------------------------------------------------------------------------
                             D E F I N I T I O N S
------------------------------------------------------------------------------*/
#define MAX_LENGTH		256

#define FILE_CPU_TEMP		"/sys/class/thermal/thermal_zone0/temp"

/*------------------------------------------------------------------------------
                    F U N C T I O N  D E C L A R A T I O N S
------------------------------------------------------------------------------*/
static long read_file(const char * path, char *buffer, long bytes_to_read);

/*------------------------------------------------------------------------------
                     F U N C T I O N  D E F I N I T I O N S
------------------------------------------------------------------------------*/
/*
 * get_cpu_temp() - Get the CPU temperature of the system
 *
 * Return: The CPU temperature in C, -1 if error.
 */
double get_cpu_temp(void)
{
	char file_data[MAX_LENGTH] = {0};
	double temperature ;
	int result;

	if (read_file(FILE_CPU_TEMP, file_data, MAX_LENGTH) <= 0) {
		IOT_ERROR("Error reading CPU temperature file");
		return -1;
	}

	result = sscanf(file_data, "%lf", &temperature);
	if (result < 1) {
		IOT_ERROR("Error getting CPU temperature: not enough fields");
		return -1;
	}
	return temperature / 1000;
}

/**
 * read_file() - Read the given file and returns its contents
 *
 * @path:		Absolute path of the file to read.
 * @buffer:		Buffer to store the contents of the file.
 * @bytes_to_read:	The number of bytes to read (including the terminating
 * 			null byte).
 *
 * Return: The number of read bytes (including the terminating null byte), -1 on
 * 		error.
 */
static long read_file(const char * path, char *buffer, long bytes_to_read)
{
	FILE *fd = NULL;
	long read_size = 0;

	if (access(path, R_OK) != 0) {
		IOT_DEBUG("File cannot be read: %s", path);
		return -1;
	}

	if ((fd = fopen(path, "rb")) == NULL) {
		IOT_DEBUG("fopen error: %s", path);
		return -1;
	}

	if (fgets(buffer, bytes_to_read, fd) == NULL) {
		IOT_DEBUG("fgets error: %s", path);
		read_size = -1;
	} else {
		read_size = strlen(buffer) + 1;
	}
	fclose(fd);

	return read_size;
}
