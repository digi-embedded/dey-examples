Digi APIX PWM Example Application
===================================

Example application to access and manage PWM lines using the Digi APIX library.

This application enables one PWM line of the board using a frequency of 1000Hz.
Then, it progressively modifies the duty cycle in a loop from 10% to 90% and
vice-versa.

The PWM lines used in this example are mapped as follows in the Digi boards:

 - **ConnectCore MP15 DVK**: MikroBus PWM channel 4 - PIN **1** of the MikroBus connector (J31).
 - **ConnectCore 8M Mini DVK**: MCA PWM0 channel 2 connected to the LED1.
 - **ConnectCore 8M Nano DVK**: MCA PWM0 channel 2 connected to the LED1.
 - **ConnectCore 8X SBC Pro**: MCA PWM2 channel 0 - Pin **A3** of the Expansion connector (J20).
 - **ConnectCore 8X SBC Express**: MCA PWM1 channel 0 - Pin **33** of the Raspberry Pi Expansion connector (J11).
 - **ConnectCore 6UL SBC Pro**: PWM4 - Pin **11** of the GPIO connector (J30).
 - **ConnectCore 6UL SBC Express**: PWM1 - Pin **27** of the expansion connector (J8).
 - **ConnectCore 6 Plus SBC**: PWM1 - Pin **10** of the parallel video (LCD) connector (J21).
 - **ConnectCore 6 SBC**: PWM1 - Pin **10** of the parallel video (LCD) connector (J21).

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-pwm-example
Example application using libdigiapix PWM support

Usage: apix-pwm-example <pwm-chip> <pwm-freq>

<pwm-chip>       PWM chip number or alias
<pwm-channel>    PWM channel number or alias
<pwm-freq>       Frequency to use (Hz)

Aliases for PWM can be configured in the library config file
```

If no arguments are provided, the example will use the default values:
 - For the interfaces, default values are configured in `/etc/libdigiapix.conf`.
 - Specific application default values are defined in the main file.

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
Copyright 2017-2022, Digi International Inc.

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
