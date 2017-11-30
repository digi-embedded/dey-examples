Digi APIX PWM Sample Application
===================================

Sample application to access and manage PWM lines using the Digi APIX library.

The application enables one PWM line of the board using a frequency of
1000Hz. Then, progressively modifies the duty cycle in a loop from 10% to
90% and vice-versa.

The PWM lines used in the sample are mapped as follows in the Digi Boards:
 - **CCIMX6 SBC**: PWM1 - Pin **10** of the parallel video (LCD) connector.
 - **CCIMX6Plus SBC**: PWM1 - Pin **10** of the parallel video (LCD) connector.
 - **CCIMX6UL SBC Express**: PWM1 - Pin **27** of the expansion connector.
 - **CCIMX6UL SBC Pro**: PWM4 - Pin **11** of the GPIO connector.

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
# ./apix-pwm-example
Example application using libdigiapix PWM support

Usage: apix-pwm-example <pwm-chip> <pwm-freq>

<pwm-chip>       PWM chip number or alias
<pwm-channel>    PWM channel number or alias
<pwm-freq>       Frequency to use (Hz)

Aliases for PWM can be configured in the library config file
```

If no arguments are provided, the example will use the default values:
 - For the interfaces, default values are configured in "/etc/libdigiapix.conf"
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