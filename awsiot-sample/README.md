AWS IoT device SDK Demo Application
===================================
Demo application to connect devices to AWS IoT.

This application monitors the CPU temperature and load and allows to remotely
switch on/off a device LED.

The demo uploads the device Thing Shadow every minute or when the difference
between the current value of temperature or load and the last reported is bigger
than a configured value (1C for temperature and 10% for CPU load).

The repository has the following directories:

* cfg_files: demo configuration file
* src: application source code

Configuring the application
---------------------------
Before launching the application, you must configure it by editing its
configuration file. By default, this file is `/etc/awsiotsdk.conf` but the
option `-c` allows the selection of another one.

You must configure:
* `thig_name`: Thing Name of the Shadow this device is associated with.
* `host`: Customer specific MQTT HOST.
  This is your custom endpoint that allows your device to connect to AWS IoT.
  You can obtain it in your 'AWS IoT Console'.
* The certificate settings:
    * `certs_path`: Absolute path to the certificates directory in the device.
    * `rootca_filename`: Name of the Root CA file in the configured
      `certs_path`.
    * `signed_cert_filename`: Name of the device signed certificate file in
      the configured `certs_path`.
    * `private_key_filename`: Name of the device private key file in the
      configured `certs_path`.
* Optionally, any other value in the configuration file.

Running the application
-----------------------
Once the settings are properly configured, launch the application:
```
~# awsiot-sample
```
You can specify the configuration file with `-c`:
```
~# awsiot-sample -c <absolute_path_to_configuration_file>
```
* The application reports its status to the topic
  `$aws/things/<thing_name>/shadow/update`. Something similar to:
  ```
  {
    "state" : {
      "reported" : {
        "temperature" : 45.971,
        "cpuLoad" : 4.504505,
        "ledON" : false
      }
    },
    "clientToken" : "<thing_name>-3"
  }
  ```
* To switch on the configured LED send to the topic
  `$aws/things/<thing_name>/shadow/update`:
  ```
  {
    "state" : {
      "desired" : {
        "ledON" : true
      }
    }
  }
  ```
* To switch off the configured LED send to the topic
  `$aws/things/<thing_name>/shadow/update`:
  ```
  {
    "state" : {
      "desired" : {
        "ledON" : false
      }
    }
  }
  ```

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
