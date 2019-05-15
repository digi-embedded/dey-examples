/*
 * main.c
 *
 * Copyright (C) 2019 by Digi International Inc.
 * All rights reserved.
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License version 2 as published by
 * the Free Software Foundation.
 *
 * Description: CAAM blob encryption/decryption example application
 *
 */
#include <getopt.h>
#include <stdio.h>
#include <sys/mman.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include "caam_ops.h"

enum caam_op {
	ENCRYPT = 1 << 0,
	DECRYPT = 1 << 1
};

static const char *program_name = "";
static enum caam_op op;
static const char *input_file;
static const char *output_file;
static const char *key_modifier_string;

static void usage_and_exit(int exitval)
{
	fprintf(stdout,
		"Example application for using CAAM blobs.\n"
		"Copyright(c) Digi International Inc.\n"
		"\n"
		"Usage: %s (-e | -d) [options] input_file [output_file]\n"
		"\n"
		"  -e  --encrypt            Read plain data and write a CAAM blob\n"
		"  -d  --decrypt            Read a CAAM blob, validate it and write the data it contains\n"
		"\n"
		"  -m  --modifier=<KM>      Set key modifier\n"
		"  -h  --help               Print help and exit\n"
		"\n"
		"      [<KM>]               Key modifier encoded as 32 hexadecimal characters\n"
		"\n"
		"Notes: if the key modifier is not specified, a zero key modifier is used.\n"
		"       if the output_file is not specified, the encryption/decryption will be done in-place.\n"
		"\n", program_name);

	exit(exitval);
}

static int bitcount(int n)
{
	int count = 0;

	while (n != 0) {
		n &= (n - 1);
		count++;
	}

	return count;
}

static void parse_options(int argc, char *argv[])
{
	int opt_index, opt;
	const char *short_options = "edm:h";
	const struct option long_options[] = {
		{"encrypt", no_argument, NULL, 'e'},
		{"decrypt", no_argument, NULL, 'd'},
		{"modifier", required_argument, NULL, 'm'},
		{"help", no_argument, NULL, 'h'},
		{NULL, 0, NULL, 0}
	};

	if (argc == 1)
		usage_and_exit(EXIT_SUCCESS);

	while (1) {
		opt =
		    getopt_long(argc, argv, short_options, long_options,
				&opt_index);
		if (opt == -1)
			break;

		switch (opt) {
		case 'e':
			op |= ENCRYPT;
			break;
		case 'd':
			op |= DECRYPT;
			break;
		case 'm':
			key_modifier_string = optarg;
			break;
		default:
			usage_and_exit(EXIT_FAILURE);
			break;
		}
	}

	/*
	 * Parse positional arguments:
	 *
	 *   - input file  [required]
	 *   - output file (optional)
	 */
	if (argc == (optind + 1)) {
		input_file = argv[optind++];
	} else if (argc == (optind + 2)) {
		input_file = argv[optind++];
		output_file = argv[optind++];
	} else {
		usage_and_exit(EXIT_FAILURE);
	}

	/* Validate one and only one operation is set */
	if (bitcount(op) != 1)
		usage_and_exit(EXIT_FAILURE);
}

static int parse_hex_string(const char *hex, uint8_t *bytes, size_t length)
{
	static const char *hex_chars = "0123456789abcdefABCDEF";
	const size_t string_len = strlen(hex);
	size_t i;

	/* Ensure correct string size and hexadecimal characters */
	if (string_len != length * 2 || strspn(hex, hex_chars) != string_len)
		return -1;

	for (i = 0; i < length; i++) {
		sscanf(hex, "%2hhx", &bytes[i]);
		hex += 2;
	}

	return 0;
}

static size_t filesize(const char *path)
{
	struct stat file_stats;

	if (stat(path, &file_stats) < 0)
		return SIZE_MAX;

	return file_stats.st_size;
}

/*
 * Note: open files are explicitly closed only if needed. They will be closed
 * by the OS when the program finishes, so there is no need to ensure they are
 * closed before finishing on error conditions.
 * The same applies to allocated memory.
 */
int main(int argc, char *argv[])
{
	int input_fd;
	uint8_t *input_data;
	size_t input_len;
	int output_fd;
	uint8_t *output_data;
	size_t output_len;
	uint8_t key_modifier[KEY_MODIFIER_SIZE];
	int ret = EXIT_SUCCESS;

	if (argc > 0)
		program_name = argv[0];

	/* read and parse command line */
	parse_options(argc, argv);

	/* read input data */
	if ((input_fd = open(input_file, O_RDONLY, 0)) < 0) {
		perror("[ERROR] Could not open input file");
		return EXIT_FAILURE;
	}

	input_len = filesize(input_file);
	if (input_len == SIZE_MAX) {
		perror("[ERROR] Could not stat input file");
		return EXIT_FAILURE;
	}

	/* this is a limitation of the current driver implementation */
	if (input_len >= BLOB_MAX_INPUT_SIZE)
		fprintf(stderr, "[WARNING] Input is too big, %s may fail\n",
			op == ENCRYPT ? "encryption" : "decryption");

	input_data = mmap(NULL, input_len, PROT_READ,
			  MAP_PRIVATE | MAP_POPULATE, input_fd, 0);
	if (input_data == MAP_FAILED) {
		perror("[ERROR] Could not map input file into memory");
		return EXIT_FAILURE;
	}

	/* if specified, read and validate key modifier */
	if (key_modifier_string) {
		if (parse_hex_string(key_modifier_string, key_modifier,
				     KEY_MODIFIER_SIZE)) {
			fprintf(stderr,
				"Invalid key modifier. A 16 bytes value encoded as 32 hexadecimal characters is required.\n"
				"Example: --modifier=000102030405060708090a0b0c0d0e0f\n");
			return EXIT_FAILURE;
		}
	} else {
		memset(key_modifier, 0, KEY_MODIFIER_SIZE);
	}

	/* alloc memory for output data */
	output_len = input_len +
		(op == ENCRYPT ? BLOB_OVERHEAD : -BLOB_OVERHEAD);
	if (op == DECRYPT && input_len <= BLOB_OVERHEAD) {
		fprintf(stderr, "[ERROR] Input data is too small to be a CAAM blob\n");
		return EXIT_FAILURE;
	}

	output_data = malloc(output_len);
	if (!output_data) {
		fprintf(stderr, "[ERROR] Not enough memory\n");
		return EXIT_FAILURE;
	}

	/* perform encryption/decryption */
	if (op == ENCRYPT) {
		if (caamblob_encrypt(input_data, input_len,
				     key_modifier, output_data)) {
			fprintf(stderr, "[ERROR] Encryption failed\n");
			return EXIT_FAILURE;
		}
	} else {
		if (caamblob_decrypt(input_data, input_len,
				     key_modifier, output_data)) {
			fprintf(stderr, "[ERROR] Decryption failed\n");
			return EXIT_FAILURE;
		}
	}

	/* if no output file given, close the input file and write to it */
	if (!output_file) {
		if (munmap(input_data, input_len) < 0)
			perror("[WARNING] Error unmapping input file");

		if (close(input_fd) < 0)
			perror("[WARNING] Error closing input file");

		output_file = input_file;
	}

	output_fd = open(output_file, O_RDWR | O_CREAT | O_TRUNC, S_IWUSR);
	if (output_fd < 0) {
		perror("[ERROR] Could not open output file");
		return EXIT_FAILURE;
	}

	if (write(output_fd, output_data, output_len) != output_len) {
		perror("[WARNING] write to output file failed");
		ret = EXIT_FAILURE;
	}

	if (close(output_fd) < 0) {
		perror("[WARNING] could not close output file");
		ret = EXIT_FAILURE;
	}

	return ret;
}
