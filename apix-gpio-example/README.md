Digi APIX GPIO Example Application
==================================
The example application uses a gpio as input (e.g. a user button) and another
one as output (e.g. a user led). The application toggles the output GPIO
whenever an interrupt is generated in the input GPIO.

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
root@ccimx6ulstarter:~# ./apix-gpio-example
Example application using libdigiapix GPIO support

Usage: apix-gpio-example <gpio_in> <gpio_out>

<gpio_in>     Push-button GPIO number or alias
<gpio_out>    LED GPIO number or alias

Aliases for GPIO numbers can be configured in the library config file
```

Compiling the application
-------------------------
This example can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using, e.g:

```
$ . <DEY-toolchain-path>/environment-setup-cortexa7hf-neon-dey-linux-gnueabi
$ make
```

More information about [Digi Embedded Yocto](https://github.com/digi-embedded/meta-digi).

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
