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
const CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED = "add-device-button-disabled";
const CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR = "add-device-input-error";
const CLASS_DEVICE_SELECTED = "devices-list-entry-selected";

const ERROR_DEVICE_ID_EMPTY = "A Device ID or MAC Address must be provided.";
const ERROR_DEVICE_ID_INVALID = "A device id format is 00000000-00000000-00000000-00000000, while a mac address format is 00:00:00:00:00:00 (optional colon separators)";
const ERROR_INVALID_PROVISION_VALUE = "Provided provision value was not valid.";

const ID_ADD_DEVICE_DIALOG = "add_device_dialog";
const ID_ADD_DEVICE_DIALOG_BUTTON = "add_device_button";
const ID_ADD_DEVICE_DIALOG_ERROR = "add_device_error";
const ID_ADD_DEVICE_DIALOG_INPUT = "add_device_input";
const ID_CONTINUE_BUTTON = "continue-button";
const ID_DEVICES_LIST = "devices-list";
const ID_REFRESH_BUTTON = "refresh-button";

const MESSAGE_LOADING_DEVICES = "Loading devices..."
const MESSAGE_REGISTERING_DEVICE = "Registering device..."

const PROVISION_TYPE_ID = "id";
const PROVISION_TYPE_MAC = "mac";
const PROVISION_TYPE_IMEI = "imei";

const REGEX_DEVICE_ID = "^(?:[a-fA-F0-9]{8}-){3}[a-fA-F0-9]{8}$";
const REGEX_DEVICE_MAC = "^(?:[a-fA-F0-9]{2}:?){5}[a-fA-F0-9]{2}$";
const REGEX_DEVICE_IMEI = "^[0-9]{15}$";

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
const TEMPLATE_DEVICE_LIST_ENTRY = "" +
    "<div id='@@ID@@' onclick='selectDevice(\"@@ID@@\")' class='devices-list-entry'>" +
    "    <table>" +
    "        <thead>" +
    "            <tr>" +
    "                <td rowspan='2'><img class='device-list-entry-status' src='/static/images/@@STATUS_IMAGE@@'></td>" +
    "                <td><span class='device-list-entry-name'>@@TYPE@@</span></td>" +
    "            </tr>" +
    "            <tr>" +
    "                <td><span class='device-list-entry-id'>@@ID@@</span></td>" +
    "            <tr>" +
    "        </thead>" +
    "    </table>" +
    "</div>";

// Variables.
var devices = [];

// Lists DRM devices.
function listDevices() {
    // Disable the refresh button.
    document.getElementById(ID_REFRESH_BUTTON).disabled = true;
    // Disable the continue button.
    document.getElementById(ID_CONTINUE_BUTTON).disabled = true;
    // Clear the devices list
    clearDevices();
    // Hide info dialog.
    showInfoPopup(false);
    // Show loading dialog.
    showLoadingPopup(true, MESSAGE_LOADING_DEVICES);
    // Send the request.
    $.post(
        "../ajax/get_devices",
        function(data) {
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process answer.
            processListDevicesAnswer(data);
            // Enable the refresh button.
            document.getElementById(ID_REFRESH_BUTTON).disabled = false;
            // Update continue button.
            updateContinueButton();
        }
    ).fail(function(response) {
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
        // Enable the refresh button.
        document.getElementById(ID_REFRESH_BUTTON).disabled = false;
    });
}

// Processes the answer of the list devices request.
function processListDevicesAnswer(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Do not continue.
        return;
    }
    // Get the devices from the JSON response.
    let readDevices = response[ID_DEVICES];
    // Check if the list of devices contains any device.
    if (readDevices == null || readDevices.length == 0)
        return;
    // Process devices.
    for (let device of readDevices) {
        // Add a new device entry to the list of devices.
        devices.push(device);
        let deviceDivContent = TEMPLATE_DEVICE_LIST_ENTRY;
        deviceDivContent = deviceDivContent.replace(/@@ID@@/g, device[ID_ID]);
        deviceDivContent = deviceDivContent.replace(/@@TYPE@@/g, device[ID_TYPE]);
        if (device[ID_ONLINE] == true)
            deviceDivContent = deviceDivContent.replace(/@@STATUS_IMAGE@@/g, IMAGE_ONLINE);
        else
            deviceDivContent = deviceDivContent.replace(/@@STATUS_IMAGE@@/g, IMAGE_OFFLINE);
        let deviceDiv = document.createElement("div");
        deviceDiv.innerHTML = deviceDivContent;
        $("#" + ID_DEVICES_LIST).append(deviceDiv);
    }
}

// Clears the list of devices.
function clearDevices() {
    unselectDevices();
    devices = [];
    $("#" + ID_DEVICES_LIST).html("");
}

// Selects the given device
function selectDevice(deviceID) {
    // Unselect all devices.
    unselectDevices();
    // Set selected style to the selected device div.
    if (document.getElementById(deviceID) != null)
        document.getElementById(deviceID).classList.add(CLASS_DEVICE_SELECTED);
    // Save selected device.
    for (i = 0; i < devices.length; i++) {
        device = devices[i];
        if (device[ID_ID] == deviceID)
            selectedDevice = device;
    }
    // Configure continue button.
    updateContinueButton();
}

// Unselects all the devices.
function unselectDevices() {
    // Clear selected style from all device divs.
    for (i = 0; i < devices.length; i++) {
        device = devices[i];
        if (document.getElementById(device[ID_ID]) != null)
            document.getElementById(device[ID_ID]).classList.remove(CLASS_DEVICE_SELECTED);
    }
    // Remove selected device.
    selectedDevice = null;
    // Configure continue button.
    updateContinueButton();
}

// Updates the continue button state.
function updateContinueButton() {
    // Initialize variables.
    var continueButton = document.getElementById(ID_CONTINUE_BUTTON);
    // Check if there is any selected device.
    if (selectedDevice != null) {
        continueButton.disabled = false;
        continueButton.onclick = function() {openSelectedDevice();};
    } else {
        continueButton.disabled = true;
        continueButton.onclick = function() { };
    }
}

// Opens the selected device
function openSelectedDevice() {
    // Avoid double click.
    document.getElementById(ID_CONTINUE_BUTTON).disabled = true;
    // Show loading dialog.
    showLoadingPopup(true);
    // Navigate to device dashboard page.
    window.open("../dashboard/?device_id=" + selectedDevice[ID_ID] + "&device_name=" + selectedDevice[ID_TYPE], "_self");
}

// Opens the "Add device" dialog.
function openAddDeviceDialog() {
    // Initialize variables.
    var addDeviceInputElement = document.getElementById(ID_ADD_DEVICE_DIALOG_INPUT);
    var addDeviceButtonElement = document.getElementById(ID_ADD_DEVICE_DIALOG_BUTTON);
    var addDeviceErrorElement = document.getElementById(ID_ADD_DEVICE_DIALOG_ERROR);
    // Reset dialog state.
    addDeviceInputElement.value = "";
    addDeviceErrorElement.innerHTML = "&nbsp;";
    addDeviceErrorElement.style.visibility = "hidden";
    if (!addDeviceButtonElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED))
        addDeviceButtonElement.classList.add(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED);
    if (addDeviceInputElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR))
        addDeviceInputElement.classList.remove(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR);
    // Show panel.
    showAddDeviceDialog(true);
}

// Closes the "Add device" dialog.
function closeAddDeviceDialog() {
    showAddDeviceDialog(false);
}

// Shows/hides the "Add device" dialog.
function showAddDeviceDialog(visible) {
    // Initialize variables.
    var addDeviceDialogElement = document.getElementById(ID_ADD_DEVICE_DIALOG);
    var addDeviceErrorElement = document.getElementById(ID_ADD_DEVICE_DIALOG_ERROR);
    // Apply visible state.
    if (visible)
        addDeviceDialogElement.style.visibility = "visible";
    else {
        addDeviceDialogElement.style.visibility = "hidden";
        addDeviceErrorElement.style.visibility = "hidden";
    }
}

// Validates the device ID.
function validateDeviceID(deviceID) {
    // Initialize variables.
    var addDeviceInputElement = document.getElementById(ID_ADD_DEVICE_DIALOG_INPUT);
    var addDeviceButtonElement = document.getElementById(ID_ADD_DEVICE_DIALOG_BUTTON);
    var addDeviceErrorElement = document.getElementById(ID_ADD_DEVICE_DIALOG_ERROR);
    var isValid = true;
    var error = ERROR_DEVICE_ID_INVALID;
    // Check if the device ID is valid.
    if (deviceID == null || deviceID == "") {
        isValid = false;
        error = ERROR_DEVICE_ID_EMPTY;
    } else
        isValid = deviceID.match(REGEX_DEVICE_ID) || deviceID.match(REGEX_DEVICE_MAC) || deviceID.match(REGEX_DEVICE_IMEI);
    // Update controls.
    if (isValid) {
        if (addDeviceButtonElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED))
            addDeviceButtonElement.classList.remove(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED);
        if (addDeviceInputElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR))
            addDeviceInputElement.classList.remove(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR);
        addDeviceErrorElement.innerHTML = "&nbsp;";
        addDeviceErrorElement.style.visibility = "hidden";
    } else {
        if (!addDeviceButtonElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED))
            addDeviceButtonElement.classList.add(CLASS_ADD_DEVICE_DIALOG_BUTTON_DISABLED);
        if (!addDeviceInputElement.classList.contains(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR))
            addDeviceInputElement.classList.add(CLASS_ADD_DEVICE_DIALOG_INPUT_ERROR);
        addDeviceErrorElement.innerHTML = error;
        addDeviceErrorElement.style.visibility = "visible";
    }
}

// Handles what happens when the "Register device" button is pressed.
function onRegisterDevice() {
    // Initialize variables.
    var addDeviceInputElement = document.getElementById(ID_ADD_DEVICE_DIALOG_INPUT);
    var provisionValue = addDeviceInputElement.value;
    var provisionType = "";
    // Determine provision type.
    if (provisionValue.match(REGEX_DEVICE_ID))
        provisionType = PROVISION_TYPE_ID;
    else if (provisionValue.match(REGEX_DEVICE_MAC))
        provisionType = PROVISION_TYPE_MAC;
    else if (provisionValue.match(REGEX_DEVICE_IMEI))
        provisionType = PROVISION_TYPE_IMEI;
    else {
        toastr.error(ERROR_INVALID_PROVISION_VALUE);
        return;
    }
    // Register the device.
    registerDevice(provisionValue, provisionType);
}

// Registers the given device ID.
function registerDevice(provisionValue, provisionType) {
    // Disable the refresh button.
    document.getElementById(ID_REFRESH_BUTTON).disabled = true;
    // Disable the continue button.
    document.getElementById(ID_CONTINUE_BUTTON).disabled = true;
    // Close the add device dialog.
    closeAddDeviceDialog();
    // Hide info dialog.
    showInfoPopup(false);
    // Show loading dialog.
    showLoadingPopup(true, MESSAGE_REGISTERING_DEVICE);
    // Send the request.
    $.post(
        "../ajax/register_device",
        JSON.stringify({
            "provision_value": provisionValue,
            "provision_type": provisionType
        }),
        function(data) {
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process answer.
            processRegisterDeviceAnswer(data);
        }
    ).fail(function(response) {
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
        // Enable the refresh button.
        document.getElementById(ID_REFRESH_BUTTON).disabled = false;
        // Refresh the continue button.
        updateContinueButton();
    });
}

// Processes the answer of the register device request.
function processRegisterDeviceAnswer(answer) {
    // Check if there was any error in the request.
    if (checkErrorResponse(answer, false)) {
        // Enable the refresh button.
        document.getElementById(ID_REFRESH_BUTTON).disabled = false;
        // Refresh the continue button.
        updateContinueButton();
    } else {
        // Update the device list.
        listDevices();
    }
}

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

    // Ethernet panel.
    ETHERNET_COMPONENT_VISIBLE = false;
    ETHERNET_COMPONENT_HAS_PANEL = false;
    ETHERNET_COMPONENT_HAS_ARROW = false;
    ETHERNET_COMPONENT_PANEL_ALWAYS_VISIBLE = false;
    ETHERNET_COMPONENT_PANEL_ORIENTATION = VALUE_TOP;
    ETHERNET_COMPONENT_PANEL_HORIZONTAL_PERCENT = 0;
    ETHERNET_COMPONENT_PANEL_VERTICAL_PERCENT = 0;
    ETHERNET_COMPONENT_ARROW_PERCENT = 0;
    ETHERNET_COMPONENT_AREA_TOP_PERCENT = 0;
    ETHERNET_COMPONENT_AREA_LEFT_PERCENT = 0;
    ETHERNET_COMPONENT_AREA_WIDTH_PERCENT = 0;
    ETHERNET_COMPONENT_AREA_HEIGHT_PERCENT = 0;

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

    // Device information.
    #deviceType;
    #platformName;
    #deviceID;
    #serialNumber;
    #ubootVersion;
    #kernelVersion;
    #deyVersion;
    #moduleVariant;
    #boardVariant;
    #boardID;
    #mcaHWVersion;
    #mcaFWVersion;
    #ethernetMAC;
    #ethernetIP;
    #wifiMAC;
    #wifiIP;
    #bluetoothMAC;
    #memoryTotal;
    #flashSize;
    #videoResolution;
    #sampleRate;
    #numSamplesUpload;

    // Class constructor.
    constructor(deviceType, platformName, deviceID, deviceData) {
        this.#deviceType = deviceType;
        this.#platformName = platformName;
        this.#deviceID = deviceID;
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
        this.#ethernetMAC = deviceData[ID_ETHERNET_MAC];
        this.#ethernetIP = deviceData[ID_ETHERNET_IP];
        this.#wifiMAC = deviceData[ID_WIFI_MAC];
        this.#wifiIP = deviceData[ID_WIFI_IP];
        this.#bluetoothMAC = deviceData[ID_BLUETOOTH_MAC];
        this.#memoryTotal = deviceData[ID_MEMORY_TOTAL];
        this.#flashSize = deviceData[ID_FLASH_SIZE];
        this.#videoResolution = deviceData[ID_VIDEO_RESOLUTION];
        this.#sampleRate = deviceData[ID_SAMPLE_RATE];
        this.#numSamplesUpload = deviceData[ID_NUM_SAMPLES_UPLOAD];
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

    // Returns the device ID.
    getDeviceID() {
        return this.#deviceID;
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

    // Returns the device Ethernet MAC address.
    getEthernetMAC() {
        return this.#ethernetMAC;
    }

    // Returns the device Ethernet IP address.
    getEthernetIP() {
        return this.#ethernetIP;
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

    // Returns the Ethernet panel data.
    getEthernetComponentData() {
        return JSON.parse(TEMPLATE_COMPONENT_DATA.format(this.ETHERNET_COMPONENT_VISIBLE,
                                                         this.ETHERNET_COMPONENT_HAS_PANEL,
                                                         this.ETHERNET_COMPONENT_HAS_ARROW,
                                                         this.ETHERNET_COMPONENT_PANEL_ALWAYS_VISIBLE,
                                                         this.ETHERNET_COMPONENT_PANEL_ORIENTATION,
                                                         this.ETHERNET_COMPONENT_PANEL_HORIZONTAL_PERCENT,
                                                         this.ETHERNET_COMPONENT_PANEL_VERTICAL_PERCENT,
                                                         this.ETHERNET_COMPONENT_ARROW_PERCENT,
                                                         this.ETHERNET_COMPONENT_AREA_TOP_PERCENT,
                                                         this.ETHERNET_COMPONENT_AREA_LEFT_PERCENT,
                                                         this.ETHERNET_COMPONENT_AREA_WIDTH_PERCENT,
                                                         this.ETHERNET_COMPONENT_AREA_HEIGHT_PERCENT));
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
}