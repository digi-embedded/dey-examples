Digi APIX I2C Example Application
=================================

Example application to access and manage I2C slaves using the Digi APIX library.

This application writes a page of an external EEPROM memory with random data.
Afterward, it reads the data back to validate it (tested with 24FC1026).

The I2C connections for this example depend on the running platform:

 - **ConnectCore MP15 DVK**: MikroBus connector (J31).
   - VCC: Pin 7
   - GND: Pin 8
   - I2C-2 SDA: Pin 6
   - I2C-2 SCL: Pin 5
 - **ConnectCore MP15 DVK**: MikroBus connector (J31).
   - VCC: Pin 7
   - GND: Pin 8
   - I2C-6 SDA: Pin 6
   - I2C-6 SCL: Pin 5
 - **ConnectCore 8M Mini DVK**: Expansion connector of the board (J48).
   - VCC: Connector J52 Pin 7
   - GND: Pin 9
   - I2C-4 SDA: Pin 3
   - I2C-4 SCL: Pin 1
 - **ConnectCore 8M Nano DVK**: Expansion connector of the board (J48).
    - VCC: Connector J52 Pin 7
    - GND: Pin 9
    - I2C-4 SDA: Pin 3
    - I2C-4 SCL: Pin 1
 - **ConnectCore 8X SBC Pro**: Expansion connector of the board (J27).
    - VCC: Pin D1
    - GND: Pin C1
    - I2C-3 SDA: Pin D8
    - I2C-3 SCL: Pin D7
 - **ConnectCore 8X SBC Express**: Raspberri Pi Expansion connector of the board (J11).
    - VCC: Pin 1
    - GND: Pin 6
    - I2C-2 SDA: Pin 3
    - I2C-2 SCL: Pin 5
 - **ConnectCore 6UL SBC Pro**: I2C connector of the board (J28).
    - VCC: Pin 3
    - GND: Pin 6
    - I2C-1 SDA: Pin 2
    - I2C-1 SCL: Pin 1
 - **ConnectCore 6UL SBC Express**: Expansion connector of the board (J8).
    - VCC: Pin 1
    - GND: Pin 6
    - I2C-1 SDA: Pin 3
    - I2C-1 SCL: Pin 5
 - **ConnectCore 6 Plus SBC**: I2C connector of the board (J28).
    - VCC: Pin 3
    - GND: Pin 6
    - I2C-3 SDA: Pin 2
    - I2C-3 SCL: Pin 1
 - **ConnectCore 6 SBC**: I2C connector of the board (J28).
    - VCC: Pin 3
    - GND: Pin 6
    - I2C-3 SDA: Pin 2
    - I2C-3 SCL: Pin 1

Running the application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-i2c-example
Example application using libdigiapix I2C support

Usage: apix-i2c-example <i2c-bus> <i2c-address> <address-size> <page-size> <page-index>

<i2c-bus>       I2C bus index to use or alias
<i2c-address>   Address of the I2C EEPROM memory
<address-size>  Number of EEPROM memory address bytes
<page-size>     EEPROM memory page size in bytes
<page-index>    EEPROM memory page index to use

Aliases for I2C can be configured in the library config file
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
