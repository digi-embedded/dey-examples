Digi APIX Watchdog Example Application
===================================

Example application to access and manage watchdog using the Digi APIX library.

This application enables a watchdog device on the board. After that, the
application starts refreshing the watchdog timer until the test time is consumed,
then the device will reboot automatically after the timeout expires.

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
# ./apix-watchdog-example
Example application using libdigiapix Watchdog support

Usage: apix-watchdog-example <watchdog_device> <timeout> <test_time>

<watchdog_device>    Watchdog device file to manage
<timeout>            Timeout to set Watchdog timer (default 10)
<test_time>          Test duration in seconds (default 60)

```

If no arguments are provided, the example will use the default values:
 - Specific application default values are defined in the main file.

Compiling the application
-------------------------
This demo can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using, e.g:

```
$> . <DEY-toolchain-path>/environment-setup-cortexa7hf-vfp-neon-dey-linux-gnueabi
$> make
```

More information about [Digi Embedded Yocto](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2018, Digi International Inc.

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
