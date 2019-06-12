Cryptochip Demo Application
===================================

This application produces random output using the internal high-quality
FIPS Random Number Generator (RNG) from the ATECC508A Atmel Cryptochip.

The random data is written in binary to the standard output, allowing to
easily use any data analysis tool (using a pipe, or redirecting the output
to a file for later analysis).

This tool is provided as a simple example application to use the CryptoAuthLib
software, which provides an interface to the Atmel cryptochip. It can also be
used to validate the cryptochip and the I2C communication.

A final application that needs to use the Atmel Cryptochip RNG should integrate
calls to the cryptoauth library, as shown in this example application source
code.

Running the application
-----------------------
The output of this application mimics what you would get by reading from a
standard random number generator, like /dev/random. 

For example, you can get hexdump to display a random sample on the standard
output:
```
~# ./cryptochip-gen-random | hexdump
0000000 6239 ddd4 b378 693f 14ed bfa1 447b cff1
0000010 275e fd14 e392 2b4a c2ff ac93 0f5e cbab
0000020 16c1 e6b7 a458 c5ea c96f 59c9 776a 41c5
0000030 a656 ffa8 2076 6917 f18a e9ad 9ea1 7915
0000040 b677 aec3 a0a2 c7b6 c8ce 2a1f aa6c d9fc
0000050 f75c 3b57 eea4 051b 3a5f 7bd9 523f 4544
0000060 cb1a 388c b655 e8ca d6eb e459 8a43 cd2f
(...)
```

You can also save the random data to a random file for later analysis:
```
~# ./cryptochip-gen-random | pv --rate > data.bin
[ 912 B/s]
```

And then run an entropy test:
```
~# ent data.bin
Entropy = 7.998261 bits per byte.

Optimum compression would reduce the size
of this 291808 byte file by 0 percent.

Chi square distribution for 291808 samples is 706.41, and randomly
would exceed this value less than 0.01 percent of the times.

Arithmetic mean value of data bytes is 127.0582 (127.5 = random).
Monte Carlo value for Pi is 3.149895135 (error 0.26 percent).
Serial correlation coefficient is 0.000944 (totally uncorrelated = 0.0).
```

Compiling the application
-------------------------
This demo can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:

```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7hf-vfp-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2017, Digi International Inc.

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
