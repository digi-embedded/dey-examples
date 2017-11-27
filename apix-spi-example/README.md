Digi APIX SPI Example Application
==================================
The example application writes a page of an external EEPROM memory with random
data and then reads the data back to validate it.

Most of EEPROM memories are compatible with the sample specifying the page size and
the number of address bytes.

The SPI connections for the sample depends on the running platform:
 - **CCIMX6 SBC**: SPI connector of the board.
    - VCC: Pin 1
    - GND: Pin 8
    - SPI-1 CLK: Pin 2
    - SPI-1 MISO: Pin 3
    - SPI-1 MOSI: Pin 4
    - SPI-1 SS0: Pin 5
 - **CCIMX6Plus SBC**: SPI connector of the board.
    - VCC: Pin 1
    - GND: Pin 8
    - SPI-1 CLK: Pin 2
    - SPI-1 MISO: Pin 3
    - SPI-1 MOSI: Pin 4
    - SPI-1 SS0: Pin 5
 - **CCIMX6UL SBC Express**: Expansion connector of the board.
    - VCC: Pin 17
    - GND: Pin 20
    - SPI-3 CLK: Pin 23
    - SPI-3 MISO: Pin 21
    - SPI-3 MOSI: Pin 19
    - SPI-3 SS0: Pin 24
 - **CCIMX6UL SBC Pro**: SPI connector of the board.
    - VCC: Pin 1
    - GND: Pin 8
    - SPI-1 CLK: Pin 2
    - SPI-1 MISO: Pin 3
    - SPI-1 MOSI: Pin 4
    - SPI-1 SS0: Pin 5

Running the application
-----------------------
Before launching the application you need to enable the SPI module with the
following command:

```
# modprobe spidev
```
Once the binary is in the target,launch the application:

```
# ./apix-spi-example
Example application using libdigiapix SPI support

Usage: apix-spi-example <spi-dev> <spi-ss> <address-size> <page-size> <page-index>

<spi-dev>       SPI device index to use or alias
<spi-ss>        SPI slave index to use or alias
<address-size>  Number of EEPROM memory address bytes
<page-size>     EEPROM memory page size in bytes
<page-index>    EEPROM memory page index to use

Aliases for SPI can be configured in the library config file
```
If no arguments are provided, the example will use the default values:
 - For the interfaces, default values are configured in "/etc/libdigiapix.conf"
 - Specific application default values are defined in the main file.

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
