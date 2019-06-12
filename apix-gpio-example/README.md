Digi APIX GPIO Example Application
==================================

Example application to access and manage GPIO lines using the Digi APIX library.

This application uses a GPIO as input (e.g. a user button) and another
one as output (e.g. a user led). The application toggles the output GPIO
whenever an interrupt is generated in the input GPIO.

The GPIOs lines used in this example are mapped as follows in the Digi boards:
 - **ConectCore 6 SBC**:
    - User button: EXP_GPIO_0 (GPIO connector, J30, Pin 6)
    - User led: USER_LED0 (Connected in the board)
 - **ConnectCore 6 Plus SBC**:
    - User button: EXP_GPIO_0 (GPIO connector, J30, Pin 6)
    - User led: USER_LED0 (Connected in the board)
 - **ConnectCore 6UL SBC Express**:
    - User button: GPIO3_IO3 (Connected in the board)
    - User led: GPIO3_IO11 (Connected in the board)
 - **ConnectCore 6UL SBC Pro**:
    - User button: MCA_IO1 (GPIO connector, J30, Pin 7)
    - User led: USER_LED1 (Connected in the board)
 - **ConnectCore 8X SBC Express**:
    - User button: GPIO0_20 (Connected in the board)
    - User led: GPIO0_19 (Connected in the board)
 - **ConnectCore 8X SBC Pro**:
    - User button: MCA_IO05 (GPIO connector, J20, Pin A5)
    - User led: USER_LED0 (Connected in the board)

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-gpio-example
Example application using libdigiapix GPIO support

Usage: apix-gpio-example <gpio_in> <gpio_out>

<gpio_in>     Push-button GPIO number or alias
<gpio_out>    LED GPIO number or alias

Aliases for GPIO numbers can be configured in the library config file
```

If no arguments are provided, the example will use the default values:
 - For the interfaces, default values are configured in `/etc/libdigiapix.conf`.
 - Specific application default values are defined in the main file.

Compiling the application
-------------------------
This example can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:

```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7hf-neon-dey-linux-gnueabi
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
