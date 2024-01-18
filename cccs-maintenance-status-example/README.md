Digi ConnectCore Cloud Services Maintenance Status Example Application
======================================================================

Example application to set the device maintenance status using ConnectCore Cloud
Services.

This application alternates 'In maintenance' and 'In service' status keeping
them the provided number of seconds as parameters.

If no parameters are provided each status is configured for 60 seconds.

Running the application
-----------------------
This application requires `cccsd` (ConnectCore Cloud Services daemon) running
on the device.

Once the binary is in the target, launch the application:

```
# ./cccs-maintenance-status-example
cccs-maintenance-status-example[1216]: [INFO] MNT: Setting maintenance to 'true'
Device IN MAINTENANCE for 60 seconds
Digi Remote Manager CAN:
    * Apply compatible configurations
    * Execute existing automations
cccs-maintenance-status-example[1216]: [INFO] MNT: Setting maintenance to 'false'
Device IN SERVICE for 60 seconds
Digi Remote Manager CANNOT:
    * Apply configurations (unless 'allow' is set)
    * Execute automations (unless 'allow' is set)
cccs-maintenance-status-example[1216]: [INFO] MNT: Setting maintenance to 'true'
Device IN MAINTENANCE for 60 seconds
Digi Remote Manager CAN:
    * Apply compatible configurations
    * Execute existing automations
cccs-maintenance-status-example[1216]: [INFO] MNT: Setting maintenance to 'false'
Device IN SERVICE for 60 seconds
Digi Remote Manager CANNOT:
    * Apply configurations (unless 'allow' is set)
    * Execute automations (unless 'allow' is set)

[...]
```

Check the status of your device from Digi Remote Manager:

1. Go to https://remotemanager.digi.com/.
2. Login with your credentials.
3. Click on the **Device ID** of your device in the **Devices** page.
4. Check the **Service Status** on the **Details** tab.

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
Copyright 2023, Digi International Inc.

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
