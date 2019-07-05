BLE GATT Server Example Application
===================================

Example application to create a BLE GATT server.

This application enables a BLE GATT server on the board. After that, the
application starts listening for BLE connections to provide custom BLE
GATT services and characteristics.


Running the application
-----------------------
Once the binary is in the target, you must configure the bluetooth
interface with the following commands:

```
~# btmgmt -i hci0 le on
hci0 Set Low Energy complete, settings: powered connectable bondable ssp br/edr le advertising secure-conn
~# btmgmt -i hci0 connectable on
hci0 Set Connectable complete, settings: powered connectable bondable ssp br/edr le advertising secure-conn
~# btmgmt -i hci0 pairable on
hci0 Set Bondable complete, settings: powered connectable bondable ssp br/edr le advertising secure-conn
~# btmgmt -i hci0 advertising on
hci0 Set Advertising complete, settings: powered connectable bondable ssp br/edr le advertising secure-conn
~#
```

After you initialize the bluetooth interface, you can start the sample application:

```
~# ./ble-gatt-server-example -h
Usage:
        ble-gatt-server-app [options]
Options:
        -i, --index <id>                Specify adapter index, e.g. hci0
        -t, --threshold <temp>          The temperature threshold to send notification
        -m, --mtu <mtu>                 The ATT MTU to use
        -v, --verbose                   Enable extra logging
        -h, --help                      Display help
~#
~# ./ble-gatt-server-example --index hci0 --threshold 50
Running GATT server
Started listening on ATT channel. Waiting for connections
Connect from XX:XX:XX:XX:XX:XX

```

Compiling the application
-------------------------
This demo can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 8X:

```
~$ . <DEY-toolchain-path>/environment-setup-aarch64-dey-linux
~$ make
```

For more information, see the [Digi Embedded Yocto online documentation](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2019, Digi International Inc.

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appears in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
