Digi APIX ADC Example Application
===================================

Example application to access and manage ADC channels using the Digi APIX library.

This application enables one ADC channel on the board. After that, the
application takes periodic samples and prints the raw value and the value in mv.

The ADC lines used in this example are mapped as follows in the Digi boards:
 - **ConnectCore MP13 DVK**: ADC1_INP14 (MikroBus socket, J31, Pin 1).
 - **ConnectCore MP15 DVK**: AN0 (GPIO connector, J41, Pin 4).
 - **ConnectCore 8M Mini DVK**: MCA_IO1 (channel 1) at XBEE1_UART_TX. By default
 this ADC channel is not enabled, you need to modify the device tree.
 - **ConnectCore 8M Nano DVK**: MCA_IO1 (channel 1) at XBEE1_UART_TX. By default
 this ADC channel is not enabled, you need to modify the device tree.
 - **ConnectCore 8X SBC Pro**: ADC_IN0 (Expansion connector, J27, Pin D13).
 - **ConnectCore 8X SBC Express**: ADC_IN0 (Expansion connector, J17, Pin 2).
 - **ConnectCore 6UL SBC Pro**: ADC1_IN2 (GPIO connector, J30, Pin 13).
 - **ConnectCore 6UL SBC Express**: ADC1_IN4 (Expansion connector, J8, Pin 7).
 - **ConnectCore 6 Plus SBC**: PMIC_ADCIN1 (GPIO connector, J30, Pin 1).
 - **ConnectCore 6 SBC**: PMIC_ADCIN1 (GPIO connector, J30, Pin 1).

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-adc-example
Example application using libdigiapix ADC support

Usage: apix-adc-example <adc_chip> <adc_channel> <interval> <number_of_samples>

<adc_chip>           ADC chip number or alias
<adc_channel>        ADC channel number or alias
<interval>           Time interval for sampling
<number_of_samples>  Number of samples to get

Alias for ADC can be configured in the library config file

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
~$ . <DEY-toolchain-path>/environment-setup-cortexa7t2hf-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2017-2023, Digi International Inc.

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
