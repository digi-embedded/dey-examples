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
const ID_AUDIO_PANEL = "audio_panel";
const ID_AUDIO_PANEL_AREA = "audio_panel_area";
const ID_AUDIO_PANEL_ARROW = "audio_panel_arrow";
const ID_AUDIO_PANEL_ICON = "audio_panel_icon";
const ID_AUDIO_SLIDER_CONTAINER = "audio_volume";
const ID_BOARD_IMAGE = "board_image";
const ID_BOARD_IMAGE_CONTAINER = "board_image_container";
const ID_CONSOLE_PANEL_AREA = "console_panel_area";
const ID_CONSOLE_PANEL_ICON = "console_panel_icon";
const ID_CPU_PANEL = "cpu_panel";
const ID_CPU_PANEL_AREA = "cpu_panel_area";
const ID_CPU_PANEL_ARROW = "cpu_panel_arrow";
const ID_CPU_PANEL_ICON = "cpu_panel_icon";
const ID_DEVICE_BOARD = "device_board";
const ID_DEVICE_INFO_TOGGLE_BUTTON = "device_info_toggle_button";
const ID_DEVICE_INFO_PANEL_HEADER = "device_info_panel_header";
const ID_DEVICE_INFO_PANEL_CONTAINER = "device_info_panel_container";
const ID_DEVICE_TOOLBAR = "device_toolbar";
const ID_ETHERNET_PANEL = "ethernet_panel";
const ID_ETHERNET_PANEL_AREA = "ethernet_panel_area";
const ID_ETHERNET_PANEL_ARROW = "ethernet_panel_arrow";
const ID_ETHERNET_PANEL_ICON = "ethernet_panel_icon";
const ID_FLASH_MEMORY_PANEL = "flash_memory_panel";
const ID_FLASH_MEMORY_PANEL_AREA = "flash_memory_panel_area";
const ID_FLASH_MEMORY_PANEL_ARROW = "flash_memory_panel_arrow";
const ID_FLASH_MEMORY_PANEL_ICON = "flash_memory_panel_icon";
const ID_HELP_PANEL = "help_panel";
const ID_HELP_POPUP_SHOWN = "help_popup_shown";
const ID_LED_PANEL = "led_panel";
const ID_LED_PANEL_AREA = "led_panel_area";
const ID_LED_PANEL_ARROW = "led_panel_arrow";
const ID_MEMORY_PANEL = "memory_panel";
const ID_MEMORY_PANEL_AREA = "memory_panel_area";
const ID_MEMORY_PANEL_ARROW = "memory_panel_arrow";
const ID_MEMORY_PANEL_ICON = "memory_panel_icon";
const ID_PLATFORM_NAME = "platform_name";
const ID_VIDEO_BRIGHTNESS_CONTAINER = "video_brightness_container";
const ID_VIDEO_PANEL = "video_panel";
const ID_VIDEO_PANEL_AREA = "video_panel_area";
const ID_VIDEO_PANEL_ARROW = "video_panel_arrow";
const ID_VIDEO_PANEL_ICON = "video_panel_icon";
const ID_VIDEO_SLIDER_CONTAINER = "video_brightness";
const ID_WIFI_BT_PANEL = "wifi_bt_panel";
const ID_WIFI_BT_PANEL_AREA = "wifi_bt_panel_area";
const ID_WIFI_BT_PANEL_ARROW = "wifi_bt_panel_arrow";
const ID_WIFI_BT_PANEL_ICON = "wifi_bt_panel_icon";

const IFACE_BT = "hci0/";
const IFACE_ETHERNET = "eth0/";
const IFACE_WIFI = "wlan0/";

const USER_LED = "user_led";

const PREFIX_STREAM = "system_monitor/";

const STREAM_CPU_LOAD = PREFIX_STREAM + "cpu_load";
const STREAM_CPU_FREQUENCY = PREFIX_STREAM + "frequency";
const STREAM_CPU_TEMPERATURE = PREFIX_STREAM + "cpu_temperature";
const STREAM_CPU_UPTIME = PREFIX_STREAM + "uptime";
const STREAM_ETHERNET_READ_BYTES = PREFIX_STREAM + IFACE_ETHERNET + "rx_bytes";
const STREAM_ETHERNET_SENT_BYTES = PREFIX_STREAM + IFACE_ETHERNET + "tx_bytes";
const STREAM_ETHERNET_STATE = PREFIX_STREAM + IFACE_ETHERNET + "state";
const STREAM_MEMORY_FREE = PREFIX_STREAM + "free_memory";
const STREAM_MEMORY_USED = PREFIX_STREAM + "used_memory";
const STREAM_WIFI_READ_BYTES = PREFIX_STREAM + IFACE_WIFI + "rx_bytes";
const STREAM_WIFI_SENT_BYTES = PREFIX_STREAM + IFACE_WIFI + "tx_bytes";
const STREAM_WIFI_STATE = PREFIX_STREAM + IFACE_WIFI + "state";
const STREAM_BT_READ_BYTES = PREFIX_STREAM + IFACE_BT + "rx_bytes";
const STREAM_BT_SENT_BYTES = PREFIX_STREAM + IFACE_BT + "tx_bytes";
const STREAM_BT_STATE = PREFIX_STREAM + IFACE_BT + "state";

const PANEL_ARROW_WIDTH_100 = 20;
const PANEL_BOARD_WIDTH_100 = 1200;

const CLASS_ARROW_DOWN = "fa-caret-down";
const CLASS_ARROW_UP = "fa-caret-up";
const CLASS_LED_PANEL_AREA_ON = "led-panel-area-on";
const CLASS_PANEL_AREA_SELECTED = "panel-area-selected";
const CLASS_PANEL_AREA_ICON_SELECTED = "panel-area-icon-selected";
const CLASS_PANEL_TOOLTIP = "panel-tooltip";
const CLASS_VALUE_ANIMATION = "value-animation";
const CLASS_VALUE_UPDATED = "value-updated";

const MESSAGE_CHANGING_VIDEO_BRIGHTNESS = "Changing video brightness...";
const MESSAGE_CHANGING_AUDIO_VOLUME = "Changing audio volume...";
const MESSAGE_READING_DEVICE_INFO = "Reading device info...";
const MESSAGE_READING_DEVICE_STATUS = "Reading device status...";
const MESSAGE_TOGGLING_LED_VALUE = "Toggling LED value...";

const ERROR_LED_UNKNOWN = "LED status has not been read yet, please wait.";
const ERROR_NOT_SUPPORTED_DEVICE_MESSAGE = "The selected device type is not supported: {0}";
const ERROR_NOT_SUPPORTED_DEVICE_TITLE = "Unsupported device";

// Variables.
var deviceInitialized = false;
var device = null;
var components = {};
var sendTimerScheduled = false;
var sendTimer = null;
var ledStatus = VALUE_UNKNOWN;
var dataPointsSocket = null;
var volume = 50;
var brightness = 50;
var componentsInitialized = false;
var initializingDevice = false;
var videoSlider = null;
var audioSlider = null;
var redrawTimer = null;

// Initializes the sliders.
function initSliders() {
    // Audio slider.
    audioSlider = new Slider("#" + ID_AUDIO_SLIDER_CONTAINER, {
        min: 0,
        max: 100,
        value: 50,
        orientation: "horizontal",
        tooltip: "hide",
        handle: "round",
        formatter: function(value) {
            return value + "%";
        }
    });
    audioSlider.on("slideStop", function(sliderValue) {
        volumeChanged(sliderValue);
    });
    // Video slider.
    videoSlider = new Slider("#" + ID_VIDEO_SLIDER_CONTAINER, {
        min: 0,
        max: 100,
        value: 50,
        orientation: "horizontal",
        tooltip: "hide",
        handle: "round",
        formatter: function(value) {
            return value + "%";
        }
    });
    videoSlider.on("slideStop", function(sliderValue) {
        brightnessChanged(sliderValue);
    });
}

// Initializes the device.
function initDevice() {
    // Sanity checks.
    if (initializingDevice)
        return;
    // Flag initializing.
    initializingDevice = true;
    // Check device state.
    if (deviceInitialized && device.getDeviceID() == getDeviceID()) {
        // Draw the device.
        drawDevice();
        // Read device status.
        readDeviceStatus();
        // Position components after some time to give time to the image to load.
        window.setTimeout(function () {
            positionComponents();
            setInfoPanelsVisible(false);
        }, 500);
    } else {
        // Flag the device as not initialized.
        deviceInitialized = false;
        // Read all device info.
        readDeviceInfo();
    }
}

// Gets the information of the device.
function readDeviceInfo() {
    // Execute only in the dashboard page.
    if (!isDashboardShowing())
        return;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_READING_DEVICE_INFO);
    // Send request to retrieve device information.
    $.post(
        "../ajax/get_device_info",
        JSON.stringify({
            "device_id": getDeviceID()
        }),
        function(data) {
            // Process only in the dashboard page.
            if (!isDashboardShowing()) {
                initializingDevice = false;
                return;
            }
            // Process device information answer.
            processDeviceInfoResponse(data);
        }
    ).fail(function(response) {
        // Stop device initialization.
        initializingDevice = false;
        // Process only in the dashboard page.
        if (!isDashboardShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the device info request.
function processDeviceInfoResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, true)) {
        // Do not continue with device status.
        initializingDevice = false;
        return;
    }
    // Create the device.
    if (!createDevice(response)) {
        // Device initialization failed, do not continue.
        initializingDevice = false;
        return;
    }
    // Position components after some time to give time to the image to load.
    window.setTimeout(function () {
       positionComponents();
       setInfoPanelsVisible(false);
    }, 500);
    // Read device status.
    readDeviceStatus();
}

// Reads the device status.
function readDeviceStatus() {
    // Execute only in the dashboard page.
    if (!isDashboardShowing())
        return;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_READING_DEVICE_STATUS);
    // Send request to retrieve device status.
    $.post(
        "../ajax/get_device_status",
        JSON.stringify({
            "device_id": getDeviceID()
        }),
        function(data) {
            // Process only in the dashboard page.
            if (!isDashboardShowing()) {
                initializingDevice = false;
                return;
            }
            // Process device status answer.
            processDeviceStatusResponse(data);
        }
    ).fail(function(response) {
        // Flag that the initializing variable.
        initializingDevice = false;
        // Process only in the dashboard page.
        if (!isDashboardShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the device status request.
function processDeviceStatusResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, true)) {
        // Do not continue.
        initializingDevice = false;
        return;
    }
    // Update the device status values.
    updateDataPointsValues(response);
    // Set LED value to a known status.
    ledStatus = VALUE_UNKNOWN;
    setLEDValue(USER_LED, false);
    // Show the help popup if needed.
    var helpShown = sessionStorage.getItem(ID_HELP_POPUP_SHOWN);
    if (helpShown == null || helpShown == "false") {
        setHelpPopupVisible(true);
        sessionStorage.setItem(ID_HELP_POPUP_SHOWN, "true");
    }
}

// Creates the device.
function createDevice(deviceData) {
    // Create the correct device instance.
    device = null;
    switch (deviceData[ID_DEVICE_TYPE]) {
        case CCIMX8MMINI.DEVICE_TYPE:
            device = new CCIMX8MMINI(getDeviceID(), deviceData);
            break;
        case CCIMX8MNANO.DEVICE_TYPE:
            device = new CCIMX8MNANO(getDeviceID(), deviceData);
            break;
        case CCIMX8X.DEVICE_TYPE:
            device = new CCIMX8X(getDeviceID(), deviceData);
            break;
    }
    if (device != null) {
        // Draw the device.
        drawDevice();
        // Automatically receive updates.
        subscribeDataPoints();
        // Set device as initialized.
        deviceInitialized = true;
        // Device created successfully.
        return true;
    } else {
        // Not recognized device, display error.
        toastr.error(ERROR_NOT_SUPPORTED_DEVICE_TITLE);
        // Hide the loading panel of the device.
        showLoadingPopup(false);
        // Show info dialog.
        showInfoPopup(true, ERROR_NOT_SUPPORTED_DEVICE_TITLE, ERROR_NOT_SUPPORTED_DEVICE_MESSAGE.format(deviceData[ID_DEVICE_TYPE]));
        // Device creation failed.
        return false;
    }
}

// Draws the device.
function drawDevice() {
    // Initialize variables.
    var boardImage = document.getElementById(ID_BOARD_IMAGE);
    // Draw the device board image.
    $(boardImage).attr("src", "./static/images/" + device.getBoardImage());
    boardImage.style.width = device.getBoardImageScale() + "%";
    boardImage.style.maxWidth = device.getBoardImageScale() + "%";
    boardImage.style.height = "auto";
    // Set the device name.
    updateFieldValue(ID_PLATFORM_NAME, device.getPlatformName());
    // Set the sample rate.
    updateFieldValue(ID_SAMPLE_RATE, device.getSampleRate());
    // Set the number of samples to upload.
    updateFieldValue(ID_NUM_SAMPLES_UPLOAD, device.getNumSamplesUpload());
    // Initialize the device component panels.
    initializeComponents();
    // Position device components.
    positionComponents();
    // Update the device information values.
    updateInfoValues();
}

// Initializes the device components.
function initializeComponents() {
    // CPU component.
    var cpuPanel = document.getElementById(ID_CPU_PANEL);
    var cpuPanelArrow = document.getElementById(ID_CPU_PANEL_ARROW);
    var cpuPanelArea = document.getElementById(ID_CPU_PANEL_AREA);
    var cpuPanelIcon = document.getElementById(ID_CPU_PANEL_ICON);
    var cpuInfo = {"panel": cpuPanel, "arrow": cpuPanelArrow, "area": cpuPanelArea, "icon": cpuPanelIcon, "data": device.getCPUComponentData()};
    components[ID_CPU] = cpuInfo;
    // Memory component.
    var memoryPanel = document.getElementById(ID_MEMORY_PANEL);
    var memoryPanelArrow = document.getElementById(ID_MEMORY_PANEL_ARROW);
    var memoryPanelArea = document.getElementById(ID_MEMORY_PANEL_AREA);
    var memoryPanelIcon = document.getElementById(ID_MEMORY_PANEL_ICON);
    var memoryInfo = {"panel": memoryPanel, "arrow": memoryPanelArrow, "area": memoryPanelArea, "icon": memoryPanelIcon, "data": device.getMemoryComponentData()};
    components[ID_MEMORY] = memoryInfo;
    // WiFi/BT component.
    var wifiBtPanel = document.getElementById(ID_WIFI_BT_PANEL);
    var wifiBtPanelArrow = document.getElementById(ID_WIFI_BT_PANEL_ARROW);
    var wifiBtPanelArea = document.getElementById(ID_WIFI_BT_PANEL_AREA);
    var wifiBtPanelIcon = document.getElementById(ID_WIFI_BT_PANEL_ICON);
    var wifiBtInfo = {"panel": wifiBtPanel, "arrow": wifiBtPanelArrow, "area": wifiBtPanelArea, "icon": wifiBtPanelIcon, "data": device.getWifiBtComponentData()};
    components[ID_WIFI_BT] = wifiBtInfo;
    // Ethernet component.
    var ethernetPanel = document.getElementById(ID_ETHERNET_PANEL);
    var ethernetPanelArrow = document.getElementById(ID_ETHERNET_PANEL_ARROW);
    var ethernetPanelArea = document.getElementById(ID_ETHERNET_PANEL_AREA);
    var ethernetPanelIcon = document.getElementById(ID_ETHERNET_PANEL_ICON);
    var ethernetInfo = {"panel": ethernetPanel, "arrow": ethernetPanelArrow, "area": ethernetPanelArea, "icon": ethernetPanelIcon, "data": device.getEthernetComponentData()};
    components[ID_ETHERNET] = ethernetInfo;
    // Console component.
    var consolePanelArea = document.getElementById(ID_CONSOLE_PANEL_AREA);
    var consolePanelIcon = document.getElementById(ID_CONSOLE_PANEL_ICON);
    var consoleInfo = {"area": consolePanelArea, "icon": consolePanelIcon, "data": device.getConsoleComponentData()};
    components[ID_CONSOLE] = consoleInfo;
    // Video component.
    var videoPanel = document.getElementById(ID_VIDEO_PANEL);
    var videoPanelArrow = document.getElementById(ID_VIDEO_PANEL_ARROW);
    var videoPanelArea = document.getElementById(ID_VIDEO_PANEL_AREA);
    var videoPanelIcon = document.getElementById(ID_VIDEO_PANEL_ICON);
    var videoInfo = {"panel": videoPanel, "arrow": videoPanelArrow, "area": videoPanelArea, "icon": videoPanelIcon, "data": device.getVideoComponentData()};
    components[ID_VIDEO] = videoInfo;
    if (!device.supportsVideoBrightness()) {
        var videoBrightnessContainer = document.getElementById(ID_VIDEO_BRIGHTNESS_CONTAINER);
        if (videoBrightnessContainer != null && videoBrightnessContainer != "undefined")
            videoBrightnessContainer.style.display = "none";
    }
    // Audio component.
    var audioPanel = document.getElementById(ID_AUDIO_PANEL);
    var audioPanelArrow = document.getElementById(ID_AUDIO_PANEL_ARROW);
    var audioPanelArea = document.getElementById(ID_AUDIO_PANEL_AREA);
    var audioPanelIcon = document.getElementById(ID_AUDIO_PANEL_ICON);
    var audioInfo = {"panel": audioPanel, "arrow": audioPanelArrow, "area": audioPanelArea, "icon": audioPanelIcon, "data": device.getAudioComponentData()};
    components[ID_AUDIO] = audioInfo;
    // LED component.
    var ledPanel = document.getElementById(ID_LED_PANEL);
    var ledPanelArrow = document.getElementById(ID_LED_PANEL_ARROW);
    var ledPanelArea = document.getElementById(ID_LED_PANEL_AREA);
    var ledInfo = {"panel": ledPanel, "arrow": ledPanelArrow, "area": ledPanelArea, "data": device.getLEDComponentData()};
    components[ID_LED] = ledInfo;
    // Flash memory component.
    var flashPanel = document.getElementById(ID_FLASH_MEMORY_PANEL);
    var flashPanelArrow = document.getElementById(ID_FLASH_MEMORY_PANEL_ARROW);
    var flashPanelArea = document.getElementById(ID_FLASH_MEMORY_PANEL_AREA);
    var flashPanelIcon = document.getElementById(ID_FLASH_MEMORY_PANEL_ICON);
    var flashInfo = {"panel": flashPanel, "arrow": flashPanelArrow, "area": flashPanelArea, "icon": flashPanelIcon, "data": device.getFlashMemoryComponentData()};
    components[ID_FLASH_MEMORY] = flashInfo;
}

// Positions the different components.
function positionComponents() {
    // Get Board Image dimensions.
    var boardImage = document.getElementById(ID_BOARD_IMAGE);
    var boardWidth = boardImage.clientWidth;
    var boardHeight = boardImage.clientHeight;
    if (boardWidth == 0 || dashboardHeight == 0)
        return;
    // Get Header height.
    var headerHeight = 0;
    var header = document.getElementById(ID_DEVICE_TOOLBAR);
    if (header != "undefined")
        headerHeight = header.clientHeight;
    // Get Dashboard size.
    var dashboardHeight = 0;
    var dashboardWidth = 0;
    var dashboard = document.getElementById(ID_DEVICE_BOARD);
    if (dashboard != "undefined") {
        dashboardWidth = dashboard.clientWidth;
        dashboardHeight = dashboard.clientHeight;
    }
    // Position panels.
    for (var component in components)
      positionComponent(components[component], boardWidth, boardHeight, headerHeight, dashboardHeight, dashboardWidth);
}

// Positions an specific component.
function positionComponent(component, boardWidth, boardHeight, headerHeight, dashboardHeight, dashboardWidth) {
    // Sanity check.
    if (component == "undefined" || component[ID_DATA] == null || component[ID_DATA] == "undefined")
        return;
    // Initialize variables
    var panelElement = component[ID_PANEL];
    var panelArrow = component[ID_ARROW];
    var panelArea = component[ID_AREA];
    var panelIcon = component[ID_ICON];
    var componentData = component[ID_DATA];
    var isVisible = componentData[ID_VISIBLE];
    var hasPanel = componentData[ID_HAS_PANEL] && panelElement != null && panelElement != "undefined";
    var hasArrow = componentData[ID_HAS_ARROW] && panelArrow != null && panelArrow != "undefined";
    var hasIcon = panelIcon != null && panelIcon != "undefined";
    var horizontalMargin = (dashboardWidth - boardWidth) / 2;
    // Check panel visibility.
    if (!isVisible) {
        if (panelArea != null)
            panelArea.style.visibility = "hidden";
        if (panelElement != null)
            panelElement.style.visibility = "hidden";
        return;
    }
    // Calculate new icon size.
    if (hasIcon) {
        var iconSize = Math.min(panelArea.clientWidth * 0.7, panelArea.clientHeight * 0.7); // 30% is margin.
        panelIcon.style.fontSize = iconSize.toString() + "px";
    }
    // Position the panel area.
    panelArea.style.left = (horizontalMargin + (boardWidth * componentData[ID_AREA_LEFT_MARGIN]) / 100).toString() + "px";
    panelArea.style.top = (((boardHeight * componentData[ID_AREA_TOP_MARGIN]) / 100) + headerHeight).toString() + "px";
    panelArea.style.width = ((boardWidth * componentData[ID_AREA_WIDTH]) / 100).toString() + "px";
    panelArea.style.height = ((boardHeight * componentData[ID_AREA_HEIGHT]) / 100).toString() + "px";
    // If there is no information panel, return.
    if (!hasPanel)
        return;
    // Calculate the panel location.
    var horizontalPixels = horizontalMargin + (boardWidth * componentData[ID_PANEL_HORIZONTAL_MARGIN]) / 100;
    var verticalPixels = (boardHeight * componentData[ID_PANEL_VERTICAL_MARGIN]) / 100;
    // Calculate the new size of the arrow.
    var arrowSize = boardWidth * PANEL_ARROW_WIDTH_100 / PANEL_BOARD_WIDTH_100;
    panelArrow.style.border = arrowSize.toString() + "px solid #fff";
    var arrowHeight = Math.sin(45) * arrowSize;
    // Calculate new arrow location.
    var arrowMargin = 0;
    if (hasArrow) {
        switch(componentData[ID_PANEL_ORIENTATION]) {
        case VALUE_LEFT:
        case VALUE_RIGHT:
            arrowMargin = ((boardHeight * componentData[ID_ARROW_MARGIN]) / 100) - verticalPixels;
            break;
        case VALUE_TOP:
        case VALUE_BOTTOM:
            arrowMargin = horizontalMargin + ((boardWidth * componentData[ID_ARROW_MARGIN]) / 100) - horizontalPixels;
            break;
        }
    }
    // Position panel and arrow depending on the orientation.
    switch(componentData[ID_PANEL_ORIENTATION]) {
        case VALUE_LEFT:
            panelElement.style.left = (horizontalPixels).toString() + "px";
            panelElement.style.top = (headerHeight + verticalPixels).toString() + "px";
            panelElement.style.right = "initial";
            panelElement.style.bottom = "initial";
            if (hasArrow) {
                panelArrow.style.left = (-1 * arrowHeight).toString() + "px";
                panelArrow.style.top = arrowMargin.toString() + "px";
            }
            break;
        case VALUE_RIGHT:
            panelElement.style.right = (horizontalPixels).toString() + "px";
            panelElement.style.top = (headerHeight + verticalPixels).toString() + "px";
            panelElement.style.left = "initial";
            panelElement.style.bottom = "initial";
            if (hasArrow) {
                panelArrow.style.right = (-1 * arrowHeight).toString() + "px";
                panelArrow.style.top = arrowMargin.toString() + "px";
            }
            break;
        case VALUE_TOP:
            panelElement.style.left = horizontalPixels.toString() + "px";
            panelElement.style.top = (headerHeight + verticalPixels).toString() + "px";
            panelElement.style.right = "initial";
            panelElement.style.bottom = "initial";
            if (hasArrow) {
                panelArrow.style.left = arrowMargin.toString() + "px";
                panelArrow.style.top = (-1 * arrowHeight).toString() + "px";
            }
            break;
        case VALUE_BOTTOM:
            panelElement.style.left = horizontalPixels.toString() + "px";
            panelElement.style.bottom = (verticalPixels + dashboardHeight - boardHeight - headerHeight).toString() + "px";
            panelElement.style.right = "initial";
            panelElement.style.top = "initial";
            if (hasArrow) {
                panelArrow.style.left = arrowMargin.toString() + "px";
                panelArrow.style.bottom = (-1 * arrowHeight).toString() + "px";
            }
            break;
    }
}

// Updates the device information values.
function updateInfoValues() {
    // Set Device ID.
    updateFieldValue(ID_DEVICE_ID, device.getDeviceID());
    // Set serial number.
    updateFieldValue(ID_SERIAL_NUMBER, device.getSerialNumber());
    // Set DEY version.
    updateFieldValue(ID_DEY_VERSION, device.getDEYVersion());
    // Set Kernel version.
    updateFieldValue(ID_KERNEL_VERSION, device.getKernelVersion());
    // Set U-Boot version.
    updateFieldValue(ID_UBOOT_VERSION, device.getUbootVersion());
    // Set module variant.
    updateFieldValue(ID_MODULE_VARIANT, device.getModuleVariant());
    // Set board variant.
    updateFieldValue(ID_BOARD_VARIANT, device.getBoardVariant());
    // Set board ID.
    updateFieldValue(ID_BOARD_ID, device.getBoardID());
    // Set MCA FW version.
    updateFieldValue(ID_MCA_FW_VERSION, device.getMCAFWVersion());
    // Set MCA HW version.
    updateFieldValue(ID_MCA_HW_VERSION, device.getMCAHWVersion());
    // Set Ethernet MAC address.
    updateFieldValue(ID_ETHERNET_MAC, device.getEthernetMAC());
    // Set Ethernet IP address.
    updateFieldValue(ID_ETHERNET_IP, device.getEthernetIP());
    // Set Wi-Fi MAC address.
    updateFieldValue(ID_WIFI_MAC, device.getWifiMAC());
    // Set Wi-Fi IP address.
    updateFieldValue(ID_WIFI_IP, device.getWifiIP());
    // Set Bluetooth MAC address.
    updateFieldValue(ID_BLUETOOTH_MAC, device.getBluetoothMAC());
    // Set total memory.
    updateFieldValue(ID_MEMORY_TOTAL, kiloBytesToMegaBytes(device.getMemoryTotal()));
    // Set flash size.
    updateFieldValue(ID_FLASH_SIZE, roundToGigaBytes(device.getFlashSize()));
    // Set video resolution.
    updateFieldValue(ID_VIDEO_RESOLUTION, device.getVideoResolution());
}

// Updates the device data points values.
function updateDataPointsValues(response) {
    // Iterate the streams in the response.
    for (var key in response)
        updateDataPointValue(key, response[key]);
}

// Updates the given data stream value.
function updateDataPointValue(streamID, value) {
    if (!streamID.startsWith(PREFIX_STREAM))
        streamID = PREFIX_STREAM + streamID;
    switch (streamID) {
        case STREAM_CPU_LOAD:
            updateValueWithEffect(ID_CPU_LOAD, roundToTwoDecimals(value));
            break;
        case STREAM_CPU_TEMPERATURE:
            updateValueWithEffect(ID_CPU_TEMPERATURE, roundToTwoDecimals(value));
            break;
        case STREAM_CPU_FREQUENCY:
            updateValueWithEffect(ID_CPU_FREQUENCY, (value / 1000));
            break;
        case STREAM_CPU_UPTIME:
            updateValueWithEffect(ID_CPU_UPTIME, secondsToTime(value));
            break;
        case STREAM_MEMORY_FREE:
            updateValueWithEffect(ID_MEMORY_FREE, kiloBytesToMegaBytes(value));
            break;
        case STREAM_MEMORY_USED:
            updateValueWithEffect(ID_MEMORY_USED, kiloBytesToMegaBytes(value));
            break;
        case STREAM_ETHERNET_STATE:
            updateValueWithEffect(ID_ETHERNET_STATE, onOffStatus(value));
            break;
        case STREAM_ETHERNET_READ_BYTES:
            updateValueWithEffect(ID_ETHERNET_READ_DATA, sizeToHumanRead(value));
            break;
        case STREAM_ETHERNET_SENT_BYTES:
            updateValueWithEffect(ID_ETHERNET_SENT_DATA, sizeToHumanRead(value));
            break;
        case STREAM_WIFI_STATE:
            updateValueWithEffect(ID_WIFI_STATE, onOffStatus(value));
            break;
        case STREAM_WIFI_READ_BYTES:
            updateValueWithEffect(ID_WIFI_READ_DATA, sizeToHumanRead(value));
            break;
        case STREAM_WIFI_SENT_BYTES:
            updateValueWithEffect(ID_WIFI_SENT_DATA, sizeToHumanRead(value));
            break;
        case STREAM_BT_STATE:
            updateValueWithEffect(ID_BT_STATE, onOffStatus(value));
            break;
        case STREAM_BT_READ_BYTES:
            updateValueWithEffect(ID_BT_READ_DATA, sizeToHumanRead(value));
            break;
        case STREAM_BT_SENT_BYTES:
            updateValueWithEffect(ID_BT_SENT_DATA, sizeToHumanRead(value));
            break;
    }
}

// Updates the value of the given element ID.
function updateValueWithEffect(elementID, value) {
    // Initialize variables.
    var htmlElement = document.getElementById(elementID);
    // Sanity checks.
    if (htmlElement == null || htmlElement == "undefined" || value == null)
        return;
    // Apply value and classes.
    htmlElement.classList.add(CLASS_VALUE_UPDATED);
    htmlElement.innerText = value;
    htmlElement.classList.add(CLASS_VALUE_ANIMATION);
    setTimeout(function() {
        htmlElement.classList.remove(CLASS_VALUE_UPDATED);
        setTimeout(function() {
            htmlElement.classList.remove(CLASS_VALUE_ANIMATION);
        }, 3000);
    }, 2000);
}

// Toggles the visibility of the given component information panel.
function toggleInfoPanelVisibility(componentName) {
    // Sanity checks.
    var component = components[componentName];
    if (component == null || component == "undefined" || component[ID_PANEL] == null || component[ID_PANEL] == "undefined")
        return;
    // Apply visibility..
    if (component[ID_PANEL].style.visibility == "visible")
        setInfoPanelVisible(componentName, false);
    else
        setInfoPanelVisible(componentName, true);
}

// Changes the visibility of the components information panels.
function setInfoPanelsVisible(visible) {
    // Sanity checks.
    if (!isDashboardShowing())
        return;
    // Iterate all panels.
    for (var component in components)
        setInfoPanelVisible(component, visible);
}

// Changes the visibility of the given component information panel.
function setInfoPanelVisible(componentName, visible) {
    // Sanity checks.
    var component = components[componentName];
    if (component == null || component == "undefined")
        return;
    var hasArrow = component[ID_DATA][ID_HAS_ARROW] && component[ID_ARROW] != null && component[ID_ARROW] != "undefined";
    var hasIcon = component[ID_ICON] != null && component[ID_ICON] != "undefined";
    // Icon is always visible.
    if (hasIcon)
        component[ID_ICON].style.visibility = "visible";
    // Apply visibility.
    if (component[ID_DATA][ID_PANEL_ALWAYS_VISIBLE] == true) {
        if (hasArrow && visible)
            component[ID_ARROW].style.visibility = "visible";
        else
            component[ID_ARROW].style.visibility = "hidden";
        component[ID_PANEL].style.visibility = "visible";
        component[ID_AREA].classList.remove(CLASS_PANEL_AREA_SELECTED);
        component[ID_AREA].classList.add(CLASS_PANEL_TOOLTIP);
    } else if (component[ID_DATA][ID_VISIBLE] == true && visible) {
        if (component[ID_PANEL] != null && component[ID_PANEL] != "undefined") {
            if (hasArrow)
                component[ID_ARROW].style.visibility = "visible";
            else
                component[ID_ARROW].style.visibility = "hidden";
            component[ID_PANEL].style.visibility = "visible";
            component[ID_AREA].classList.add(CLASS_PANEL_AREA_SELECTED);
            component[ID_AREA].classList.remove(CLASS_PANEL_TOOLTIP);
            if (hasIcon)
                component[ID_ICON].classList.add(CLASS_PANEL_AREA_ICON_SELECTED);
        }
    } else {
        if (component[ID_PANEL] != null && component[ID_PANEL] != "undefined") {
            component[ID_ARROW].style.visibility = "hidden";
            component[ID_PANEL].style.visibility = "hidden";
            component[ID_AREA].classList.remove(CLASS_PANEL_AREA_SELECTED);
            component[ID_AREA].classList.add(CLASS_PANEL_TOOLTIP);
        }
        if (component[ID_DATA][ID_VISIBLE] == false && hasIcon)
            component[ID_ICON].style.visibility = "hidden";
        else if (hasIcon)
            component[ID_ICON].classList.remove(CLASS_PANEL_AREA_ICON_SELECTED);
    }
}

// Toggles the visibility of the device info panel.
function toggleDeviceInfoVisibility() {
    // Initialize variables.
    var deviceInfoPanel = document.getElementById(ID_DEVICE_INFO_PANEL_CONTAINER);
    var deviceInfoButton = document.getElementById(ID_DEVICE_INFO_TOGGLE_BUTTON);
    // Sanity checks.
    if (deviceInfoPanel == null || deviceInfoButton == null)
        return;
    // Check visibility.
    if (deviceInfoButton.classList.contains(CLASS_ARROW_UP)) {
        $("#" + ID_DEVICE_INFO_PANEL_CONTAINER).slideUp("fast", function() {
            deviceInfoButton.classList.remove(CLASS_ARROW_UP);
            deviceInfoButton.classList.add(CLASS_ARROW_DOWN);
            adjustImageSize();
        });
    } else {
        $("#" + ID_DEVICE_INFO_PANEL_CONTAINER).slideDown("fast", function() {
            deviceInfoButton.classList.remove(CLASS_ARROW_DOWN);
            deviceInfoButton.classList.add(CLASS_ARROW_UP);
            adjustImageSize();
        });
    }
}

// Toggles the visibility of the help popup.
function toggleHelpPopup() {
    // Initialize variables.
    var helpPopup = document.getElementById(ID_HELP_PANEL);
    // Sanity checks.
    if (helpPopup == null)
        return;
    // Check visibility.
    if (helpPopup.style.visibility == "visible") {
        setHelpPopupVisible(false);
        sessionStorage.setItem(ID_HELP_POPUP_SHOWN, "true");
    } else
        setHelpPopupVisible(true);
}

// Changes the visibility of the help popup.
function setHelpPopupVisible(visible) {
    // Initialize variables.
    var helpPanel = document.getElementById(ID_HELP_PANEL);
    // Sanity checks.
    if (helpPanel == null)
        return;
    // Apply visibility.
    if (visible)
        helpPanel.style.visibility = "visible";
    else
        helpPanel.style.visibility = "hidden";
}

// Adjust the image board size.
function adjustImageSize() {
    // Sanity checks.
    if (!isDashboardShowing() || device == null || device == "undefined")
        return;
    // Initialize variables.
    var deviceBoardElement = document.getElementById(ID_DEVICE_BOARD);
    var boardImageElement = document.getElementById(ID_BOARD_IMAGE);
    var deviceInfoHeaderElement = document.getElementById(ID_DEVICE_INFO_PANEL_HEADER);
    var deviceInfoContainerElement = document.getElementById(ID_DEVICE_INFO_PANEL_CONTAINER);
    var deviceToolbarElement = document.getElementById(ID_DEVICE_TOOLBAR);
    var dashboardHeight = deviceBoardElement.getBoundingClientRect().height;
    var toolbarHeight = deviceToolbarElement.getBoundingClientRect().height;
    var deviceInfoContainerHeight = deviceInfoContainerElement.getBoundingClientRect().height;
    var deviceInfoHeaderHeight = deviceInfoHeaderElement.getBoundingClientRect().height;
    var infoHeight = deviceInfoContainerHeight + deviceInfoHeaderHeight;
    var availableImageHeight = dashboardHeight - infoHeight - toolbarHeight - 20; // .device-info -> margin-top
    // Adjust size.
    do {
        var newWidthPercent = availableImageHeight * parseInt(boardImageElement.style.width.replace("%", "")) / boardImageElement.getBoundingClientRect().height;
        if (newWidthPercent > device.getBoardImageScale())
            newWidthPercent = device.getBoardImageScale();
        boardImageElement.style.width = newWidthPercent + "%";
        positionComponents();
    }  while (boardImageElement.getBoundingClientRect().height > (dashboardHeight - toolbarHeight - infoHeight))
    // Force a redraw, icons do not display correctly at first.
    if (redrawTimer != null)
        clearTimeout(redrawTimer);
    redrawTimer = setTimeout(positionComponents, 200);
}

// Processes a video brightness changed event.
function brightnessChanged(newValue) {
    // Show the loading panel of the device.
    showLoadingPopup(true, MESSAGE_CHANGING_VIDEO_BRIGHTNESS);
    // Disable the slider.
    videoSlider.disable();
    // Send request to change the video brightness value.
    $.post(
        "../ajax/set_video_brightness",
        JSON.stringify({
            "device_id": getDeviceID(),
            "value": newValue
        }),
        function(data) {
            // Process only in the dashboard page.
            if (!isDashboardShowing())
                return;
            // Process answer.
            processSetVideoBrightnessResponse(data);
        }
    ).fail(function(response) {
        // Process only in the dashboard page.
        if (!isDashboardShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading panel of the device.
        showLoadingPopup(false);
        // Restore the slider value.
        videoSlider.setValue(brightness);
        // Enable the slider.
        videoSlider.enable();
    });
}

// Processes the "set video brightness" request answer.
function processSetVideoBrightnessResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Restore the slider value.
        videoSlider.setValue(brightness);
    } else {
        // Save new brightness value.
        brightness = videoSlider.getValue();
    }
    // Hide the loading panel of the device.
    showLoadingPopup(false);
    // Enable the slider.
    videoSlider.enable();
}

// Processes an audio volume changed event.
function volumeChanged(newValue) {
    // Show the loading panel of the device.
    showLoadingPopup(true, MESSAGE_CHANGING_AUDIO_VOLUME);
    // Disable the slider.
    audioSlider.disable();
    // Send request to change the audio volume value.
    $.post(
        "../ajax/set_audio_volume",
        JSON.stringify({
            "device_id": getDeviceID(),
            "value": newValue
        }),
        function(data) {
            // Process only in the dashboard page.
            if (!isDashboardShowing())
                return;
            // Process answer.
            processSetAudioVolumeResponse(data);
        }
    ).fail(function(response) {
        // Process only in the dashboard page.
        if (!isDashboardShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading panel of the device.
        showLoadingPopup(false);
        // Restore the slider value.
        audioSlider.setValue(volume);
        // Enable the slider.
        audioSlider.enable();
    });
}

// Processes the "set audio volume" request answer.
function processSetAudioVolumeResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Restore the slider value.
        audioSlider.setValue(volume);
    } else {
        // Save new volume value.
        volume = audioSlider.getValue();
    }
    // Hide the loading panel of the device.
    showLoadingPopup(false);
    // Enable the slider.
    audioSlider.enable();
}

// Toggles the user LED.
function toggleUserLED() {
    toggleLED(USER_LED);
}

// Toggles the status of the given LED.
function toggleLED(ledName) {
    // Sanity checks.
    if (ledStatus == VALUE_UNKNOWN) {
        toastr.info(ERROR_LED_UNKNOWN);
        return;
    }
    // Execute action.
    setLEDValue(ledName, !ledStatus);
}

// Sets the value of the given LED.
function setLEDValue(ledName, ledValue) {
    // Show the loading panel of the device.
    showLoadingPopup(true, MESSAGE_TOGGLING_LED_VALUE);
    // Send request to change the LED status.
    $.post(
        "../ajax/set_led_value",
        JSON.stringify({
            "device_id": getDeviceID(),
            "led_name": ledName,
            "value": ledValue
        }),
        function(data) {
            // Finish initialization.
            initializingDevice = false;
            // Process only in the dashboard page.
            if (!isDashboardShowing())
                return;
            // Process answer.
            processSetLEDResponse(data);
        }
    ).fail(function(response) {
        // Finish initialization.
        initializingDevice = false;
        // Process only in the dashboard page.
        if (!isDashboardShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading panel of the device.
        showLoadingPopup(false);
        // Hide the info panel of the device.
        showInfoPopup(false);
    });
}

// Processes the set LED request answer.
function processSetLEDResponse(response) {
    // Position components after some time to give time to the image to load.
    window.setTimeout(function () {
       positionComponents();
       setInfoPanelsVisible(false);
    }, 500);
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Update the LED status.
        updateLEDStatus();
    }
    // Hide the loading panel of the device.
    showLoadingPopup(false);
    // Hide the info panel of the device.
    showInfoPopup(false);
}

// Updates the LED status.
function updateLEDStatus() {
    // Initialize variables.
    var ledPanelArea = document.getElementById(ID_LED_PANEL_AREA);
    // Update LED value.
    if (ledStatus == VALUE_UNKNOWN)
        ledStatus = false;
    else
        ledStatus = !ledStatus;
    if (ledPanelArea == null || ledPanelArea == undefined)
        return;
    // Change LED panel area class.
    if (ledStatus)
        ledPanelArea.classList.add(CLASS_LED_PANEL_AREA_ON);
    else
        ledPanelArea.classList.remove(CLASS_LED_PANEL_AREA_ON);
}

// Handles what happens when the change sample rate button is pressed.
function changeSampleRate() {
    // Navigate to management page.
    window.open("../management/?device_id=" + getDeviceID() + "&device_name=" + getDeviceName(), "_self");
}

// Subscribes to any datapoint change.
function subscribeDataPoints() {
    // Sanity checks.
    if (dataPointsSocket != null)
        return;
    // Create the web socket.
    var socketPrefix = window.location.protocol == "https:" ? "wss" : "ws";
    dataPointsSocket = new WebSocket(socketPrefix + "://" + window.location.host + "/ws/datapoints/" + device.getDeviceID());
    // Define the callback to be notified when data is received in the web socket.
    dataPointsSocket.onmessage = function(e) {
        if (isDashboardShowing()) {
            // Initialize variables.
            var event = JSON.parse(e.data);
            var stream = event[ID_STREAM];
            var value = event[ID_VALUE];
            // Update the datapoint value.
            updateDataPointValue(stream, value);
        }
    };
}
