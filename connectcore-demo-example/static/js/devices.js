/*
 * Copyright 2022, Digi International Inc.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// Constants.
const TEMPLATE_COMPONENT_DATA = "" +
    "{" +
    "   \"" + ID_VISIBLE + "\" : {0}," +
    "   \"" + ID_HAS_PANEL + "\" : {1}," +
    "   \"" + ID_HAS_ARROW + "\" : {2}," +
    "   \"" + ID_PANEL_ALWAYS_VISIBLE + "\" : {3}," +
    "   \"" + ID_PANEL_ORIENTATION + "\" : \"{4}\"," +
    "   \"" + ID_PANEL_HORIZONTAL_MARGIN + "\" : {5}," +
    "   \"" + ID_PANEL_VERTICAL_MARGIN + "\" : {6}," +
    "   \"" + ID_ARROW_MARGIN + "\" : {7}," +
    "   \"" + ID_AREA_TOP_MARGIN + "\" : {8}," +
    "   \"" + ID_AREA_LEFT_MARGIN + "\" : {9}," +
    "   \"" + ID_AREA_WIDTH + "\" : {10}," +
    "   \"" + ID_AREA_HEIGHT + "\" : {11}" +
    "}"

// Class that represents a ConnectCore device.
class ConnectCoreDevice {

    // Variables
    // Board image.
    BOARD_IMAGE;
    BOARD_IMAGE_SCALE;

    // CPU panel.
    CPU_COMPONENT_VISIBLE = false;
    CPU_COMPONENT_HAS_PANEL = false;
    CPU_COMPONENT_HAS_ARROW = false;
    CPU_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    CPU_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    CPU_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    CPU_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    CPU_COMPONENT_ARROW_PERCENT = 0;
    CPU_COMPONENT_AREA_TOP_PERCENT = 0;
    CPU_COMPONENT_AREA_LEFT_PERCENT = 0;
    CPU_COMPONENT_AREA_WIDTH_PERCENT = 0;
    CPU_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Memory panel.
    MEMORY_COMPONENT_VISIBLE = false;
    MEMORY_COMPONENT_HAS_PANEL = false;
    MEMORY_COMPONENT_HAS_ARROW = false;
    MEMORY_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    MEMORY_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    MEMORY_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    MEMORY_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    MEMORY_COMPONENT_ARROW_PERCENT = 0;
    MEMORY_COMPONENT_AREA_TOP_PERCENT = 0;
    MEMORY_COMPONENT_AREA_LEFT_PERCENT = 0;
    MEMORY_COMPONENT_AREA_WIDTH_PERCENT = 0;
    MEMORY_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // WiFi/BT panel.
    WIFI_BT_COMPONENT_VISIBLE = false;
    WIFI_BT_COMPONENT_HAS_PANEL = false;
    WIFI_BT_COMPONENT_HAS_ARROW = false;
    WIFI_BT_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    WIFI_BT_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    WIFI_BT_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    WIFI_BT_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    WIFI_BT_COMPONENT_ARROW_PERCENT = 0;
    WIFI_BT_COMPONENT_AREA_TOP_PERCENT = 0;
    WIFI_BT_COMPONENT_AREA_LEFT_PERCENT = 0;
    WIFI_BT_COMPONENT_AREA_WIDTH_PERCENT = 0;
    WIFI_BT_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Ethernet0 panel.
    ETHERNET0_COMPONENT_VISIBLE = false;
    ETHERNET0_COMPONENT_HAS_PANEL = false;
    ETHERNET0_COMPONENT_HAS_ARROW = false;
    ETHERNET0_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    ETHERNET0_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    ETHERNET0_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    ETHERNET0_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    ETHERNET0_COMPONENT_ARROW_PERCENT = 0;
    ETHERNET0_COMPONENT_AREA_TOP_PERCENT = 0;
    ETHERNET0_COMPONENT_AREA_LEFT_PERCENT = 0;
    ETHERNET0_COMPONENT_AREA_WIDTH_PERCENT = 0;
    ETHERNET0_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Ethernet1 panel.
    ETHERNET1_COMPONENT_VISIBLE = false;
    ETHERNET1_COMPONENT_HAS_PANEL = false;
    ETHERNET1_COMPONENT_HAS_ARROW = false;
    ETHERNET1_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    ETHERNET1_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    ETHERNET1_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    ETHERNET1_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    ETHERNET1_COMPONENT_ARROW_PERCENT = 0;
    ETHERNET1_COMPONENT_AREA_TOP_PERCENT = 0;
    ETHERNET1_COMPONENT_AREA_LEFT_PERCENT = 0;
    ETHERNET1_COMPONENT_AREA_WIDTH_PERCENT = 0;
    ETHERNET1_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Console.
    CONSOLE_COMPONENT_VISIBLE = false;
    CONSOLE_COMPONENT_HAS_PANEL = false;
    CONSOLE_COMPONENT_HAS_ARROW = false;
    CONSOLE_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    CONSOLE_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    CONSOLE_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    CONSOLE_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    CONSOLE_COMPONENT_ARROW_PERCENT = 0;
    CONSOLE_COMPONENT_AREA_TOP_PERCENT = 0;
    CONSOLE_COMPONENT_AREA_LEFT_PERCENT = 0;
    CONSOLE_COMPONENT_AREA_WIDTH_PERCENT = 0;
    CONSOLE_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Video panel.
    VIDEO_COMPONENT_VISIBLE = false;
    VIDEO_COMPONENT_HAS_PANEL = false;
    VIDEO_COMPONENT_HAS_ARROW = false;
    VIDEO_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    VIDEO_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    VIDEO_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    VIDEO_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    VIDEO_COMPONENT_ARROW_PERCENT = 0;
    VIDEO_COMPONENT_AREA_TOP_PERCENT = 0;
    VIDEO_COMPONENT_AREA_LEFT_PERCENT = 0;
    VIDEO_COMPONENT_AREA_WIDTH_PERCENT = 0;
    VIDEO_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Audio panel.
    AUDIO_COMPONENT_VISIBLE = false;
    AUDIO_COMPONENT_HAS_PANEL = false;
    AUDIO_COMPONENT_HAS_ARROW = false;
    AUDIO_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    AUDIO_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    AUDIO_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    AUDIO_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    AUDIO_COMPONENT_ARROW_PERCENT = 0;
    AUDIO_COMPONENT_AREA_TOP_PERCENT = 0;
    AUDIO_COMPONENT_AREA_LEFT_PERCENT = 0;
    AUDIO_COMPONENT_AREA_WIDTH_PERCENT = 0;
    AUDIO_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // LED panel.
    LED_COMPONENT_VISIBLE = false;
    LED_COMPONENT_HAS_PANEL = false;
    LED_COMPONENT_HAS_ARROW = false;
    LED_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    LED_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    LED_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    LED_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    LED_COMPONENT_ARROW_PERCENT = 0;
    LED_COMPONENT_AREA_TOP_PERCENT = 0;
    LED_COMPONENT_AREA_LEFT_PERCENT = 0;
    LED_COMPONENT_AREA_WIDTH_PERCENT = 0;
    LED_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Flash memory panel.
    FLASH_MEMORY_COMPONENT_VISIBLE = false;
    FLASH_MEMORY_COMPONENT_HAS_PANEL = false;
    FLASH_MEMORY_COMPONENT_HAS_ARROW = false;
    FLASH_MEMORY_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    FLASH_MEMORY_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    FLASH_MEMORY_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_ARROW_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_AREA_TOP_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_AREA_LEFT_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_AREA_WIDTH_PERCENT = 0;
    FLASH_MEMORY_COMPONENT_AREA_HEIGHT_PERCENT = 0;

    // Capabilities
    SUPPORTS_VIDEO_BRIGHTNESS;
    SUPPORTS_DUAL_ETHERNET;

    NUM_ETHERNET_INTERFACES = 2;

    // Device information.
    #deviceType;
    #platformName;
    #serialNumber;
    #ubootVersion;
    #kernelVersion;
    #deyVersion;
    #moduleVariant;
    #boardVariant;
    #boardID;
    #mcaHWVersion;
    #mcaFWVersion;
    #ethernetMAC = [];
    #ethernetIP = [];
    #wifiMAC;
    #wifiIP;
    #bluetoothMAC;
    #memoryTotal;
    #flashSize;
    #videoResolution;
    #sampleRate;
    #numSamplesUpload;

    // Class constructor.
    constructor(deviceType, platformName, deviceData) {
        this.#deviceType = deviceType;
        this.#platformName = platformName;
        this.#initDevice(deviceData);
    }

    // Initializes the device with the provided data.
    #initDevice(deviceData) {
        this.#ubootVersion = deviceData[ID_UBOOT_VERSION];
        this.#serialNumber = deviceData[ID_SERIAL_NUMBER];
        this.#kernelVersion = deviceData[ID_KERNEL_VERSION];
        this.#deyVersion = deviceData[ID_DEY_VERSION];
        this.#moduleVariant = deviceData[ID_MODULE_VARIANT];
        this.#boardVariant = deviceData[ID_BOARD_VARIANT];
        this.#boardID = deviceData[ID_BOARD_ID];
        this.#mcaHWVersion = deviceData[ID_MCA_HW_VERSION];
        this.#mcaFWVersion = deviceData[ID_MCA_FW_VERSION];
        this.#wifiMAC = deviceData[ID_WIFI_MAC];
        this.#wifiIP = deviceData[ID_WIFI_IP];
        this.#bluetoothMAC = deviceData[ID_BLUETOOTH_MAC];
        this.#memoryTotal = deviceData[ID_MEMORY_TOTAL];
        this.#flashSize = deviceData[ID_FLASH_SIZE];
        this.#videoResolution = deviceData[ID_VIDEO_RESOLUTION];
        this.#sampleRate = deviceData[ID_SAMPLE_RATE];
        this.#numSamplesUpload = deviceData[ID_NUM_SAMPLES_UPLOAD];
        for (var index = 0; index < this.NUM_ETHERNET_INTERFACES; index++) {
            this.#ethernetMAC[index] = deviceData[eval("ID_ETHERNET" + index + "_MAC")];
            this.#ethernetIP[index] = deviceData[eval("ID_ETHERNET" + index + "_IP")];
        }
    }

    refreshIPs(eth0_ip, eth1_ip, wifi_ip) {
        this.#ethernetIP[0] = eth0_ip;
        this.#ethernetIP[1] = eth1_ip;
        this.#wifiIP = wifi_ip;
    }

    // Returns the device type.
    getDeviceType() {
        return this.#deviceType;
    }

    // Returns the platform name.
    getPlatformName() {
        return this.#platformName;
    }

    // Returns the device serial number.
    getSerialNumber() {
        return this.#serialNumber;
    }

    // Returns the board image file name.
    getBoardImage() {
        return this.BOARD_IMAGE;
    }

    // Returns the board image scale.
    getBoardImageScale() {
        return this.BOARD_IMAGE_SCALE;
    }

    // Returns the device U-Boot version.
    getUbootVersion() {
        return this.#ubootVersion;
    }

    // Returns the device Kernel version.
    getKernelVersion() {
        return this.#kernelVersion;
    }

    // Returns the device DEY version.
    getDEYVersion() {
        return this.#deyVersion;
    }

    // Returns the device module variant.
    getModuleVariant() {
        return this.#moduleVariant;
    }

    // Returns the device board variant.
    getBoardVariant() {
        return this.#boardVariant;
    }

    // Returns the device board ID.
    getBoardID() {
        return this.#boardID;
    }

    // Returns the device MCA hardware version.
    getMCAHWVersion() {
        return this.#mcaHWVersion;
    }

    // Returns the device MCA firmware version.
    getMCAFWVersion() {
        return this.#mcaFWVersion;
    }

    // Returns the device Ethernet MAC address for the given interface index.
    getEthernetMAC(index=0) {
        if (index >= this.NUM_ETHERNET_INTERFACES)
            return "";
        return this.#ethernetMAC[index];
    }

    // Returns the device Ethernet IP address for the given interface index.
    getEthernetIP(index=0) {
        if (index >= this.NUM_ETHERNET_INTERFACES)
            return "";
        return this.#ethernetIP[index];
    }

    // Returns the device WiFi MAC address.
    getWifiMAC() {
        return this.#wifiMAC;
    }

    // Returns the device WiFi IP address.
    getWifiIP() {
        return this.#wifiIP;
    }

    // Returns the device Bluetooth MAC address.
    getBluetoothMAC() {
        return this.#bluetoothMAC;
    }

    // Returns the device total memory.
    getMemoryTotal() {
        return this.#memoryTotal;
    }

    // Returns the device flash size.
    getFlashSize() {
        return this.#flashSize;
    }

    // Returns the video resolution.
    getVideoResolution() {
        return this.#videoResolution;
    }

    // Returns the sample rate.
    getSampleRate() {
        return this.#sampleRate;
    }

    // Returns the number of samples to upload each batch.
    getNumSamplesUpload() {
        return this.#numSamplesUpload;
    }

    // Returns the CPU panel data.
    getCPUComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.CPU_COMPONENT_VISIBLE,
                                                         this.CPU_COMPONENT_HAS_PANEL,
                                                         this.CPU_COMPONENT_HAS_ARROW,
                                                         this.CPU_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.CPU_COMPONENT_PANEL_ORIENTATION,
                                                         this.CPU_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.CPU_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.CPU_COMPONENT_ARROW_PERCENT,
                                                         this.CPU_COMPONENT_AREA_TOP_PERCENT,
                                                         this.CPU_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.CPU_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.CPU_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the Memory panel data.
    getMemoryComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.MEMORY_COMPONENT_VISIBLE,
                                                         this.MEMORY_COMPONENT_HAS_PANEL,
                                                         this.MEMORY_COMPONENT_HAS_ARROW,
                                                         this.MEMORY_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.MEMORY_COMPONENT_PANEL_ORIENTATION,
                                                         this.MEMORY_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.MEMORY_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.MEMORY_COMPONENT_ARROW_PERCENT,
                                                         this.MEMORY_COMPONENT_AREA_TOP_PERCENT,
                                                         this.MEMORY_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.MEMORY_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.MEMORY_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the WiFi panel data.
    getWifiBtComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.WIFI_BT_COMPONENT_VISIBLE,
                                                         this.WIFI_BT_COMPONENT_HAS_PANEL,
                                                         this.WIFI_BT_COMPONENT_HAS_ARROW,
                                                         this.WIFI_BT_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.WIFI_BT_COMPONENT_PANEL_ORIENTATION,
                                                         this.WIFI_BT_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.WIFI_BT_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.WIFI_BT_COMPONENT_ARROW_PERCENT,
                                                         this.WIFI_BT_COMPONENT_AREA_TOP_PERCENT,
                                                         this.WIFI_BT_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.WIFI_BT_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.WIFI_BT_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the Ethernet panel data for the given interface index.
    getEthernetComponentData(index=0) {
        if (index >= this.NUM_ETHERNET_INTERFACES)
            return "";
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(eval("this.ETHERNET" + index + "_COMPONENT_VISIBLE"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_HAS_PANEL"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_HAS_ARROW"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_PANEL_ALWAYS_VISIBLE"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_PANEL_ORIENTATION"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_PANEL_HORIZONTAL_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_PANEL_VERTICAL_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_ARROW_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_AREA_TOP_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_AREA_LEFT_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_AREA_WIDTH_PERCENT"),
                                                         eval("this.ETHERNET" + index + "_COMPONENT_AREA_HEIGHT_PERCENT")));
    }

    // Returns the Console panel data.
    getConsoleComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.CONSOLE_COMPONENT_VISIBLE,
                                                         this.CONSOLE_COMPONENT_HAS_PANEL,
                                                         this.CONSOLE_COMPONENT_HAS_ARROW,
                                                         this.CONSOLE_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.CONSOLE_COMPONENT_PANEL_ORIENTATION,
                                                         this.CONSOLE_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.CONSOLE_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.CONSOLE_COMPONENT_ARROW_PERCENT,
                                                         this.CONSOLE_COMPONENT_AREA_TOP_PERCENT,
                                                         this.CONSOLE_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.CONSOLE_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.CONSOLE_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the Video panel data.
    getVideoComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.VIDEO_COMPONENT_VISIBLE,
                                                         this.VIDEO_COMPONENT_HAS_PANEL,
                                                         this.VIDEO_COMPONENT_HAS_ARROW,
                                                         this.VIDEO_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.VIDEO_COMPONENT_PANEL_ORIENTATION,
                                                         this.VIDEO_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.VIDEO_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.VIDEO_COMPONENT_ARROW_PERCENT,
                                                         this.VIDEO_COMPONENT_AREA_TOP_PERCENT,
                                                         this.VIDEO_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.VIDEO_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.VIDEO_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the Audio panel data.
    getAudioComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.AUDIO_COMPONENT_VISIBLE,
                                                         this.AUDIO_COMPONENT_HAS_PANEL,
                                                         this.AUDIO_COMPONENT_HAS_ARROW,
                                                         this.AUDIO_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.AUDIO_COMPONENT_PANEL_ORIENTATION,
                                                         this.AUDIO_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.AUDIO_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.AUDIO_COMPONENT_ARROW_PERCENT,
                                                         this.AUDIO_COMPONENT_AREA_TOP_PERCENT,
                                                         this.AUDIO_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.AUDIO_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.AUDIO_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the LED panel data.
    getLEDComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.LED_COMPONENT_VISIBLE,
                                                         this.LED_COMPONENT_HAS_PANEL,
                                                         this.LED_COMPONENT_HAS_ARROW,
                                                         this.LED_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.LED_COMPONENT_PANEL_ORIENTATION,
                                                         this.LED_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.LED_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.LED_COMPONENT_ARROW_PERCENT,
                                                         this.LED_COMPONENT_AREA_TOP_PERCENT,
                                                         this.LED_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.LED_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.LED_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns the flash memory panel data.
    getFlashMemoryComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.FLASH_MEMORY_COMPONENT_VISIBLE,
                                                         this.FLASH_MEMORY_COMPONENT_HAS_PANEL,
                                                         this.FLASH_MEMORY_COMPONENT_HAS_ARROW,
                                                         this.FLASH_MEMORY_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.FLASH_MEMORY_COMPONENT_PANEL_ORIENTATION,
                                                         this.FLASH_MEMORY_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_ARROW_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_AREA_TOP_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.FLASH_MEMORY_COMPONENT_AREA_HEIGHT_PERCENT));
    }

    // Returns whether the device supports video brightness or not.
    supportsVideoBrightness() {
        return this.SUPPORTS_VIDEO_BRIGHTNESS;
    }

     // Returns whether the device supports dual ethernet or not.
    supportsDualEthernet() {
        return this.SUPPORTS_DUAL_ETHERNET;
    }
}
