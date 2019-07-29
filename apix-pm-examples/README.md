Digi APIX Power Management example Applications
===============================================

Example applications to access and manage CPU functions using the Digi APIX library.

These applications show how to work with different functions and provide different
examples to work with the CPU.

Running the apix-cpu-example application
-----------------------
Once the binary is in the target, launch the application:

```
# ./apix-cpu-example
Example application using libdigiapix CPU support

Usage: apix-cpu-example [options]

		-l                  List available frequencies
		-s <frequency>      Set the desired frequency
		-v                  Show the current governor
		-g                  List available governors
		-f <governor>       Set the desired governor
		-t                  List the temperatures of the system
		-c <temperature>    Set the critical temperature
		-p <temperature>    Set the passive temperature
		-u                  Get the CPU usage
		-n                  Get the number of CPU cores
		-d <core_number>    Disable the selected core
		-e <core_number>    Enable the selected core

		Examples:
		apix-cpu-example -l
		apix-cpu-example -f userspace
		apix-cpu-example -t
```

The application needs a valid argument to run, some of the arguments need additional parameters.

Running the apix-pm-application application
-----------------------
Once the binary is in the target, launch the application:

```
# ./apix-pm-application
		Example application using libdigiapix power management support.
		This application enables counter measurements in the CPU and GPU
		in order to reduce the temperature.

		Usage: apix-pm-application [options]

		-c                  Apply CPU counter measurements
		-g                  Apply GPU counter measurements
		-b                  Apply CPU & GPU counter measurements

		Examples:
		apix-pm-application -g
		apix-pm-application -b
```

This application enables countermeasures in order to reduce the temperature of the CPU.

If the CPU countermeasures are set, it will select the userspace governor and will set
the minimum frequency in the device in order to reduce the temperature.

If the GPU counter measurements are set, it will reduce the GPU scaler to half of its original value.
Note: Some modules such as CC6UL don't have a GPU.

Compiling the application
-------------------------
This demo can be compiled using a Digi Embedded Yocto based toolchain. Make
sure to source the corresponding toolchain of the platform you are using,
for example, for ConnectCore 6UL:
```
~$ . <DEY-toolchain-path>/environment-setup-cortexa7hf-vfp-neon-dey-linux-gnueabi
~$ make
```

For more information, see the [Digi Embedded Yocto](https://github.com/digi-embedded/meta-digi).

License
-------
Copyright 2019, Digi International Inc.

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

