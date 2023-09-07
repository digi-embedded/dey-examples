Digi ConnectCore Cloud Services Upload Binary File Example Application
======================================================================

Example application to upload a binary file to Remote Manager using ConnectCore
Cloud Services.

This application uploads the content of file `/etc/build` as a binary data point
to stream `binary_dp`.

Running the application
-----------------------
This application requires `cccsd` (ConnectCore Cloud Services daemon) running
on the device.

Once the binary is in the target, launch the application:

```
# ./cccs-upload-binary-file-example
cccs-upload-binary-file-example[35036]: [DEBUG] CCCSD: Connected to CCCSD (s=4)
cccs-upload-binary-file-example[35036]: [DEBUG] CCCS daemon ready
cccs-upload-binary-file-example[35036]: [INFO] Sending binary file '/etc/build'
cccs-upload-binary-file-example[35036]: [INFO] DP: Sending data points to CCCSD
cccs-upload-binary-file-example[35036]: [DEBUG] CCCSD: Connected to CCCSD (s=4)
cccs-upload-binary-file-example[35036]: [DEBUG] CCCSD: Success from CCCSD
cccs-upload-binary-file-example[35036]: [DEBUG] DP: Binary data point uploaded to 'binary_dp'
#
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
