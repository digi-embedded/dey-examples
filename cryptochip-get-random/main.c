/*
 * Copyright (c) 2017 Digi International Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 * =======================================================================
 */
#include <stdio.h>
#include <unistd.h>

#include <cryptoauthlib.h>

int main(void)
{
	uint8_t random_number[32];
	bool is_locked = false;

	atcab_init(&cfg_ateccx08a_i2c_default);

	/* Check if config zone is locked */
	atcab_is_locked(LOCK_ZONE_CONFIG, &is_locked);
	if (!is_locked) {
		printf("**WARNING**: the cryptochip is currently not configured. Run "
		       "ecc-test-main at least once to be able to run this example.\n");
		atcab_release();
		return 1;
	}

	while (true) {	
		atcab_random(random_number);
		write(STDOUT_FILENO, random_number, sizeof(random_number));
	}
}
