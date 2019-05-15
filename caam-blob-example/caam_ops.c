/*
 * caam_ops.c
 *
 * Copyright (C) 2019 by Digi International Inc.
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 as published by
 * the Free Software Foundation.
 *
 * Description: CAAM blob encryption/decryption functions
 */

#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>

#include "caam_ops.h"

int caamblob_encrypt(const uint8_t *data,
		     size_t size,
		     const uint8_t keymod[KEY_MODIFIER_SIZE],
		     uint8_t *encrypted_data)
{
	const struct caam_kb_data kb_data = {
		.rawkey = (char *) data,
		.rawkey_len = size,
		.keyblob = (char *) encrypted_data,
		.keyblob_len = size + BLOB_OVERHEAD,
		.keymod = (char *) keymod,
		.keymod_len = KEY_MODIFIER_SIZE
	};
	int fd;
	int ret = 0;

	if (size <= 0)
		return -1;

	if ((fd = open(CAAM_KEY_DEV, O_RDWR)) < 0) {
		perror("[ERROR] could not open CAAM keyblob device node:");
		return fd;
	}

	if (ioctl(fd, CAAM_KB_ENCRYPT, &kb_data)) {
		fprintf(stderr, "[ERROR] could not encrypt data.\n");
		ret = 1;
	}

	close(fd);

	return ret;
}

int caamblob_decrypt(const uint8_t *encrypted_data,
		     size_t encrypted_size,
		     const uint8_t keymod[KEY_MODIFIER_SIZE],
		     uint8_t *data)
{
	const struct caam_kb_data kb_data = {
		.rawkey = (char *) data,
		.rawkey_len = encrypted_size - BLOB_OVERHEAD,
		.keyblob = (char *) encrypted_data,
		.keyblob_len = encrypted_size,
		.keymod = (char *) keymod,
		.keymod_len = KEY_MODIFIER_SIZE
	};
	int fd;
	int ret = 0;

	if (encrypted_size <= BLOB_OVERHEAD) {
		fprintf(stderr, "[ERROR] encrypted data is too small (%zu bytes < blob overhead (%d bytes)\n",
			encrypted_size, BLOB_OVERHEAD);
		return -1;
	}

	if ((fd = open(CAAM_KEY_DEV, O_RDWR)) < 0) {
		perror("[ERROR] could not open CAAM keyblob device node");
		return fd;
	}

	if (ioctl(fd, CAAM_KB_DECRYPT, &kb_data)) {
		fprintf(stderr, "[ERROR] could not decrypt data.\n");
		ret = 1;
	}

	close(fd);

	return ret;
}
