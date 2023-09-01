Digi ConnectCore Cloud Services Data Request Example Application
================================================================

Example application to listen to data requests from Remote Manager using
ConnectCore Cloud Services.

This application registers a `get_time` data request.
When this request arrives the application sends back the current time.

Running the application
-----------------------
This application requires `cccsd` (ConnectCore Cloud Services daemon) running
on the device.

Once the binary is in the target, launch the application:

```
# ./cccs-data-request-example 
cccs-data-request-example[1011]: [DEBUG] CCCSD: Connected to CCCSD (s=4)
cccs-data-request-example[1011]: [DEBUG] CCCS daemon ready
cccs-data-request-example[1011]: [INFO] DREQ: Registering 'get_time' data request
cccs-data-request-example[1011]: [DEBUG] CCCSD: Connected to CCCSD (s=7)
cccs-data-request-example[1011]: [DEBUG] CCCSD: Success from CCCSD
Waiting for Remote Manager request...
Press 'q' and 'Enter' to exit

```

Send a `get_time` data request to your device.
To do so:

1. Go to https://remotemanager.digi.com/.
2. Login with your credentials.
3. Get your device identifier from the **Devices** page:
    a. Go to the **Management > Devices** tab.
    b. If you have more than one device, you can filter using the **MAC**
       address of your device:
        1. Click on the filter text box and select **MAC**.
        2. Type the MAC address of your device and press `Enter`.
        3. Copy the **Device ID** of your device from the table by using the **Copy Device ID** button that appears next to it when you hover over the item.
4. Go to the **System > API Explorer** tab. From here you can test the Web
   Services API.
5. Click the **Examples** combo.
6. Select **SCI > Data Service > Send Request**.
A request appears inside the Body text box.
7. Modify the request to stop the sampling process on your device:
    a. Replace the `device id` value with the copied one.
    b. Replace the `target_name` value with `get_time`.
    c. Remove the payload of the request.
       The request should be similar to the following:

        ```xml
        <sci_request version="1.0">
            <data_service>
                <targets>
                    <device id="00000000-00000000-00XXXXXX-XXXXXXXX" />
                </targets>
                <requests>
                    <device_request target_name="get_time"></device_request>
                </requests>
            </data_service>
        </sci_request>
      ```
   Where `00000000-00000000-00XXXXXX-XXXXXXXX` is the Device ID.
8. Click **Send** to send the request to your device.
In the **Response** text box you can review the answer from the device:

    ```xml
    <sci_reply version="1.0">
        <data_service>
            <device id="00000000-00000000-00XXXXXX-XXXXXXXX">
                <requests>
                    <device_request target_name="get_time" status="0">Time: Fri Sep  1 11:36:33 2023</device_request>
                </requests>
            </device>
        </data_service>
    </sci_reply>
    ```
Where `00000000-00000000-00XXXXXX-XXXXXXXX` is the Device ID.

The application prints out the received request:

```
[...]
Waiting for Remote Manager request...
Press 'q' and 'Enter' to exit
cccs-data-request-example[1163]: [DEBUG] get_time_cb: target='get_time'
cccs-data-request-example[1163]: [DEBUG] get_time_status_cb: target='get_time' - error='0' - error-hint='Success'
```

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
