/*
 * caam_ops.h
 *
 * Copyright (C) 2019 by Digi International Inc.
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 as published by
 * the Free Software Foundation.
 *
 * Description: CAAM blob encryption/decryption functions
 *
 */

#ifndef CAAM_OPS_H
#define CAAM_OPS_H

#include <fcntl.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stropts.h>
#include <unistd.h>

#include "caam_keyblob.h"

#define CAAM_KEY_DEV		"/dev/caam_kb"

/* Define space required for BKEK (32 bytes) + MAC tag (16 bytes) storage in any blob */
#define BLOB_OVERHEAD 		(32 + 16)

/* Key modifier: 16 bytes for a general memory blob (see SRM 5.8.4.7.1) */
#define KEY_MODIFIER_SIZE 	16

/*
 * Testing shows that input sizes bigger than this value usually fail.
 */
#define BLOB_MAX_INPUT_SIZE 	(1024 * 1024 - BLOB_OVERHEAD)

int caamblob_encrypt(const uint8_t *data,
		     size_t size,
		     const uint8_t keymod[KEY_MODIFIER_SIZE],
		     uint8_t *encrypted_data);

int caamblob_decrypt(const uint8_t *encrypted_data,
		     size_t encrypted_size,
		     const uint8_t keymod[KEY_MODIFIER_SIZE],
		     uint8_t *data);

#endif /* CAAM_OPS_H */
