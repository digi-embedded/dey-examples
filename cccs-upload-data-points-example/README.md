Digi ConnectCore Cloud Services Upload Data Points Example Application
======================================================================

Example application to upload data points to Remote Manager using ConnectCore
Cloud Services.

This application uploads an integer value with an incremented counter to a data
stream called 'incremental'. The counter value is incremented every 5 seconds.
The uploads takes place every 10 new samples, that is every 50 seconds.

Running the application
-----------------------
This application requires `cccsd` (ConnectCore Cloud Services daemon) running
on the device.

Once the binary is in the target, launch the application:

```
# ./cccs-upload-data-points-example
cccs-upload-data-points-example[1010]: [DEBUG] CCCSD: Connected to CCCSD (s=4)
cccs-upload-data-points-example[1010]: [DEBUG] CCCS daemon ready
cccs-upload-data-points-example[1090]: [INFO] Counter = 0
cccs-upload-data-points-example[1090]: [INFO] Counter = 1
cccs-upload-data-points-example[1090]: [INFO] Counter = 2
cccs-upload-data-points-example[1090]: [INFO] Counter = 3
cccs-upload-data-points-example[1090]: [INFO] Counter = 4
cccs-upload-data-points-example[1090]: [INFO] Counter = 5
cccs-upload-data-points-example[1090]: [INFO] Counter = 6
cccs-upload-data-points-example[1090]: [INFO] Counter = 7
cccs-upload-data-points-example[1090]: [INFO] Counter = 8
cccs-upload-data-points-example[1090]: [INFO] Counter = 9
cccs-upload-data-points-example[1090]: [INFO] Sending data sream with new incremental value
cccs-upload-data-points-example[1090]: [INFO] DP: Sending data points to CCCSD
cccs-upload-data-points-example[1090]: [DEBUG] CCCSD: Connected to CCCSD (s=4)
cccs-upload-data-points-example[1090]: [DEBUG] CCCSD: Success from CCCSD
cccs-upload-data-points-example[1090]: [INFO] Counter = 10
cccs-upload-data-points-example[1090]: [INFO] Counter = 11

```

Compiling the application
-------------------------
This example can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:

```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7t2hf-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2023, Digi International Inc.

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
