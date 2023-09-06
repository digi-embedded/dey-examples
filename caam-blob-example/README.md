CAAM blob Example Application
===================================

This example application shows how to encapsulate/decapsulate data to/from CAAM blobs.
CAAM blobs are a way to protect sensitive data by encrypting their contents.
You can think of CAAM blobs as data encrypted with an internal unreadable device-specific key which is protected by the hardware.
Data encapsulated in a CAAM blob can only be decapsulated by the device that created it.
When creating CAAM blobs, the input data size is limited to 65487 bytes.
Note that CAAM blobs are slightly bigger than the input data (48 bytes bigger).

A key modifier may be used to further differentiate the key used in a particular blob.

WARNING: CAAM blobs are only secure if created in a secure boot enable device.

For more information about CAAM blobs, see 'Secure Storage' in the [online documentation](https://www.digi.com/resources/documentation/digidocs/embedded/).

Note: This application is only supported when using a platform and Digi Embedded Yocto version that support Trustfence.

Running the application
-----------------------

The following example shows how to encrypt and decrypt and file in place:

```
~# echo "Test file" > test.txt
~# caam-blob-example -e test.txt
~# hexdump -C test.txt
00000000  01 ee 30 e3 31 6b 72 94  94 06 62 e2 ef 17 4e 05  |..0.1kr...b...N.|
00000010  34 c3 7b 96 58 35 ad b7  a2 89 b6 bc eb eb 81 39  |4.{.X5.........9|
00000020  3c b2 e7 d7 2d 93 7d ff  8b a8 80 bd 55 e9 70 cf  |<...-.}.....U.p.|
00000030  20 51 9f 15 9e c5 aa 68  b3 90                    | Q.....h..|
0000003a
~# caam-blob-example -d test.txt
~# hexdump -C test.txt
00000000  54 65 73 74 20 66 69 6c  65 0a                    |Test file.|
0000000a
```

You can also use the "-m" parameter to specify a key modifier. In that case, you also need the same key modifier to decrypt the data.
The key modifier is a 16 byte value encoded as 32 hexadecimal characters.
If you want to write the CAAM blob to a different file, add another positional argument.

```
~# caam-blob-example -e -m ff0102030405060708090a0b0c0d0e0f test.txt encrypted.bin
~# caam-blob-example -d encrypted.bin decrypted.txt
[ERROR] could not decrypt data.
[ERROR] Decryption failed
~# caam-blob-example -d -m ff0102030405060708090a0b0c0d0e0f encrypted.bin decrypted.txt
~# cat decrypted.txt
Test file
```

Compiling the application
-------------------------
This demo can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:

```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7t2hf-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2019-2023, Digi International Inc.

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appears in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
