Digi APIX CAN Example Applications
===================================

Example applications to access and manage CAN interface using the Digi APIX library.

These applications enable one CAN interface of the board and start a transmission or
reception using the selected baudrate.

In the reception example the application will wait for frames and print them in the
console. You can configure filters to listen to some kind of frames only.

In the transmission example the application will generate and send frames configure the DLC,
the ID and print in the console.

The CAN interface for this example depends on the running platform:

 - **ConnectCore MP13 DVK**: CAN connector of the board (J33).
   - 5V: Pin 1
   - CAN1_H: Pin 2
   - CAN1_L: Pin 3
   - GND: Pin 4
 - **ConnectCore MP15 DVK**: CAN connector of the board (J33).
   - 5V: Pin 1
   - CAN1_H: Pin 2
   - CAN1_L: Pin 3
   - GND: Pin 4
 - **ConnectCore 8M Mini DVK**: CAN connector of the board (J24).
   - 5V: Pin 1
   - CAN1_H: Pin 2
   - CAN1_L: Pin 3
   - GND: Pin 4
- **ConnectCore 8M Nano DVK**: CAN connector of the board (J24).
   - 5V: Pin 1
   - CAN1_H: Pin 2
   - CAN1_L: Pin 3
   - GND: Pin 4
- **ConnectCore 8X SBC Pro**: Expansion connector (J27).
   - CAN1_L: D 5
   - CAN1_H: D 6
   - GND: Pin 3
   - CAN2_L: C 5
   - CAN2_H: C 6
- **ConnectCore 6UL SBC Pro**: CAN connector of the board (J27).
   - CAN1_L: Pin 1
   - CAN1_H: Pin 2
   - GND: Pin 3
   - CAN2_L: Pin 4 *
   - CAN2_H: Pin 5 *
   - GND: Pin 6
- **ConnectCore 6UL SBC Express**: Raspberry PI connector (J8). (An external CAN transceiver is needed).
   - RX: Pin 26
   - TX: Pin 22
- **ConnectCore 6 Plus SBC**: CAN connector of the board (J27).
   - CAN1_L: Pin 1
   - CAN1_H: Pin 2
   - GND: Pin 3
   - CAN2_L: Pin 4 *
   - CAN2_H: Pin 5 *
   - GND: Pin 6
- **ConectCore 6 SBC**: CAN connector of the board (J27).
   - CAN1_L: Pin 1
   - CAN1_H: Pin 2
   - GND: Pin 3
   - CAN2_L: Pin 4 *
   - CAN2_H: Pin 5 *
   - GND: Pin 6

*Note: These pins are not enabled by default, you need to create a custom device tree

Running the apix-can-recv-example application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-can-recv-example
		Example application using libdigiapix CAN support"
		Usage: %s -i <can-iface> -b <bitrate> [options]"
		-i <can-iface>      Name of the CAN interface"
		-b <bitrate>        Bitrate to use (Hz)"
		"-s <sample-ponit>  Bitrate Sample Point\n"
		-f <filters>        Comma-separated filter list in the format"
		                    id:mask (id and mask values in hex)"
		"-o                  Enable CAN FD support\n"
		"--- CAN FD options ---\n"
		"  -d <dbitrate>      Maximum data bitrate for CAN FD (Hz)\n"
		"  -a <dsample-point> CAN FD data bitate sample point\n"
		"---\n"
		-p                  Print message info"
		-c                  Print message counter"
		-h                  Help"
		Examples:\n"
		%s -i can0 -b 500000 -f 023:fff,006:00f
		%s -i can1 -b 100000

```
If no arguments are provided, the example will use the default values:
 - Specific application default values are defined in the main file.

 The application will wait for frames. If you provide some filters it will only
 wait for the chosen ones.

 Running the apix-can-send-example application
-----------------------
Once the binary is in the target, launch the application:

```
~# ./apix-can-send-example
Example application using libdigiapix CAN support"
		"Usage: %s -i <can-iface> -b <bitrate> [options]"
		"-i <can-iface>      Name of the CAN interface"
		"-b <bitrate>        Bitrate to use (Hz)"
		"-s <sample_point>   CAN bitrate sample point\n"
		"-n <num_msgs>       Number of messages to send (default 1)"
		"-t <delay>          Inter frame delay in ms (default 100)"
		"-I <msg_id>         Message id in hex (default 123)"
		"-l <data_length>    Payload length (default 8)"
		"-o                  Enable CAN FD support\n"
		"--- CAN FD options ---\n"
		"  -d <dbitrate>      Maximum data bitrate for CAN FD (Hz)\n"
		"  -p <dsample-point> CAN FD data bitate sample point\n"
		"---\n"
		"-r                  Generate a random ID (will ignore the -I parameter)"
		"-p                  Generate a random payload (will ignore the -l parameter)"
		"-e                  Use extended id"
		"-R                  Set RTR"
```

You need to provide at least the can-iface and the bitrate.
For the other values if arguments are not provided, the example will use the default values:
 - Specific application default values are defined in the main file.

The application will send frames periodically with the selected time rate.

Compiling the application
-------------------------
These demos can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:

```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7hf-vfp-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2018-2022, Digi International Inc.

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
