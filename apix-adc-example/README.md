Digi APIX ADC Sample Application
===================================

Sample application to access and manage ADC channels using the Digi APIX library.

The application enables one ADC channel on the board. After that, the application 
takes periodic samples and prints the raw value and the value in mv.

The ADC lines used in the sample are mapped as follows in the Digi Boards:
 - **CCIMX6 SBC**: PMIC_ADCIN1 (GPIO Connector Pin 1).
 - **CCIMX6UL SBC Express**: ADC1_IN4 (Expansion Connector Pin 7).
 - **CCIMX6UL SBC Pro**: ADC1_IN2 (GPIO Connector Pin 13).

The following device tree modifications are required for the sample to work:
 - **CCIMX6 SBC**: _No device tree modifications are required._
 - **CCIMX6UL SBC Express**:
```
&adc1 {
	pinctrl-names = "default";
	pinctrl-0 = <&pinctrl_adc1>;
	adc-ch-list = <4>;
	status = "okay";
};
 
&iomuxc {
	imx6ul-ccimx6ul {
		pinctrl_adc1: adc1grp {
			fsl,pins = <
				MX6UL_PAD_GPIO1_IO04__GPIO1_IO04        0xb0
			>;
		};
	};
};
```
 - **CCIMX6UL SBC Pro**:
```
&adc1 {
	pinctrl-names = "default";
	pinctrl-0 = <&pinctrl_adc1>;
	adc-ch-list = <2>;
	status = "okay";
};
 
&iomuxc {
	imx6ul-ccimx6ul {
		pinctrl_adc1: adc1grp {
			fsl,pins = <
				MX6UL_PAD_GPIO1_IO02__GPIO1_IO02        0xb0
			>;
		};
	};
};
```

Running the application
-----------------------
Once the binary is in the target, launch the application:
```
#> apix-adc-example [adc_chip adc_channel interval number_of_samples]
```
Where:
 - 'adc_chip' the ADC chip number.
 - 'adc_channel' the ADC channel number.
 - 'interval' is the time interval between samples.
 - 'number_of_samples' is the number of samples to take.

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
