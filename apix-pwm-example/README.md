Digi APIX PWM Sample Application
===================================

Sample application to access and manage PWM lines using the Digi APIX library.

The application enables one PWM line of the board using a frequency of 
1000Hz. Then, progressively modifies the duty cycle in a loop from 10% to 
90% and vice-versa.

The PWM lines used in the sample are mapped as follows in the Digi Boards:
 - **CCIMX6 SBC**: PWM1 - Pin **10** of the parallel video (LCD) connector.
 - **CCIMX6UL SBC Express**: PWM1 - Pin **27** of the expansion connector.
 - **CCIMX6UL SBC Pro**: PWM4 - Pin **11** of the GPIO connector.

The following device tree modifications are required for the sample to work:
 - **CCIMX6 SBC**:
```
/* PWM1 */
&pwm1 {
	pinctrl-names = "default";
	pinctrl-0 = <&pinctrl_pwm1>;
	status = "okay";
};

/* Pin mux configuration */
&iomuxc {
	imx6q-ccimx6sbc {
		pinctrl_pwm1: pwm1grp {
			fsl,pins = <
				MX6QDL_PAD_DISP0_DAT8__PWM1_OUT 0x110b0
			>;
		};
	};
};
```
 - **CCIMX6UL SBC Express**:
    _No device tree modifications are required._
 - **CCIMX6UL SBC Pro**:
```
/* PWM4 */
&pwm4 {
	pinctrl-names = "default";
	pinctrl-0 = <&pinctrl_pwm4>;
	clocks = <&clks IMX6UL_CLK_PWM4>,
		<&clks IMX6UL_CLK_PWM4>;
	status = "okay";
};

/* Pin mux configuration */
&iomuxc {
	imx6ul-ccimx6ul {
		pinctrl_pwm4: pwm4grp {
			fsl,pins = <
				MX6UL_PAD_GPIO1_IO05__PWM4_OUT    0x110b0
			>;
		};
	};
};
```

Running the application
-----------------------
Once the binary is in the target, launch the application:
```
#> pwm-digiapix-sample
```

The sample applicaion is ready to work with all Digi platforms using the corresponding
PWM chip (0 by default) and a frequency of 1000Hz. If a different PWM chip or frequency 
is required, the application allows 2 additional parameters in order to customize 
these values:
```
#> pwm-digiapix-sample [pwm-chip pwm-freq]
```
Where:
 - 'pwm-chip' is an optional PWM chip number.
 - 'pwm-freq' is an optional frequency to use (Hz).

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