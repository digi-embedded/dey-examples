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
const ELEMENT_ETHERNET = "ethernet";
const ELEMENT_WIFI = "wifi";

const FIELD_DEFAULT_GATEWAY = "_default_gateway";
const FIELD_DNS1_ADDRESS = "_dns1_addr";
const FIELD_DNS2_ADDRESS = "_dns2_addr";
const FIELD_ENABLE = "_enable";
const FIELD_ENCRYPTION_TYPE = "_enc_type";
const FIELD_ERROR = "_error";
const FIELD_MAC_ADDRESS = "_mac";
const FIELD_IP_ADDRESS = "_ip_addr";
const FIELD_IP_MODE = "_ip_mode";
const FIELD_PARAM = "_param";
const FIELD_PASSWORD = "_password";
const FIELD_SAVE_BUTTON = "_save_button";
const FIELD_SSID = "_ssid";
const FIELD_SUBNET_MASK = "_subnet_mask";

const ID_DNS1 = "dns1";
const ID_DNS2 = "dns2";
const ID_ENABLE = "enable";
const ID_ETH0_TITLE = "eth0_title";
const ID_GATEWAY = "gateway";
const ID_IP = "ip";
const ID_IP_MODE = "type";
const ID_INTERFACE = "interface";
const ID_MAC = "mac";
const ID_NETMASK = "netmask";
const ID_PANEL_CONTAINER = "_panel_container";
const ID_PASSWORD = "psk";
const ID_SECURITY_MODE = "sec_mode";
const ID_SSID = "ssid";
const ID_TOGGLE_BUTTON = "_toggle_button";

const IP_MODE_DHCP = "dhcp";
const IP_MODE_STATIC = "static";

const ERROR_IP_VALUE_FORMAT = "Value must follow this format: XXX.XXX.XXX.XXX";
const ERROR_PASSWORD_INVALID = "Password must be between 8 and 63 characters long";
const ERROR_SSID_INVALID = "SSID value is not valid";
const ERROR_UNKNOWN = "Unknown error saving configuration.";

const MESSAGE_LOADING_CONFIGURATION = "Loading configuration...";
const MESSAGE_SAVING_CONFIGURATION = "Saving configuration...";
const MESSAGE_CONFIGURATION_SAVED = "Configuration saved successfully!";

const PREFIX_ETHERNET = "eth";
const PREFIX_WIFI = "wlan";

const REGEX_IP = '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';
const REGEX_SSID = '^[^!#;+\\]/"\t][^+\\]/"\t]{0,31}$';
const REGEX_PASSWORD = '^[\u0020-\u007e]{8,63}$';

const ALL_ELEMENTS = "all";

// Variables.
var readingNetworkInfo = false;
var passwordChanged = false;

// Initializes the network page.
function initializeNetworkPage() {
    // Sanity checks.
    if (!isNetworkShowing())
        return;
    // Read network configuration.
    readElements = [ELEMENT_ETHERNET, ELEMENT_WIFI];
    readConfiguration(readElements, ALL_ELEMENTS);
}

// Gets the device configuration the given elements.
function readConfiguration(readElements, parseElement) {
    // Execute only in the network page.
    if (!isNetworkShowing() || readingNetworkInfo)
        return;
    // Flag reading variable.
    readingNetworkInfo = true;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_LOADING_CONFIGURATION);
    // Send request to retrieve configuration.
    $.post(
        "http://" + getServerAddress() + "/ajax/get_config",
        JSON.stringify({
            "elements": readElements
        }),
        function(data) {
            // Process only in the network page.
            if (!isNetworkShowing())
                return;
            // Process answer.
            processReadConfigurationResponse(data, parseElement);
        }
    ).fail(function(response) {
        // Flag reading variable.
        readingNetworkInfo = false;
        // Clear the element being read.
        elementReading = "";
        // Process only in the network page.
        if (!isNetworkShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
        // Update controls.
        updateAllControls();
    });
}

// Processes the response of the read configuration request.
function processReadConfigurationResponse(response, parseElement) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Fill network info.
        fillNetworkInfo(JSON.parse(response[ID_DATA]), parseElement);
    } else {
        // Flag reading variable.
        readingNetworkInfo = false;
        // Hide the loading panel.
        showLoadingPopup(false);
    }
}

// Fills network information.
function fillNetworkInfo(response, parseElement) {
    var numEthernetIfaces = 0;
    var numWifiIfaces = 0;
    for (const [element, elementData] of Object.entries(response)) {
        if (element != ELEMENT_ETHERNET && element != ELEMENT_WIFI)
            continue;
        for (const [iface, ifaceData] of Object.entries(elementData)) {
            if (!iface.startsWith(PREFIX_WIFI) && !iface.startsWith(PREFIX_ETHERNET))
                continue;
            if (parseElement != ALL_ELEMENTS && iface != parseElement)
                continue;
            var enabled = ifaceData[ID_ENABLE];
            var ipMode = ifaceData[ID_IP_MODE];
            if (iface.startsWith(PREFIX_ETHERNET))
                numEthernetIfaces += 1;
            else if (iface.startsWith(PREFIX_WIFI))
                numWifiIfaces += 1;
            // Fill MAC.
            document.getElementById(iface + FIELD_MAC_ADDRESS).innerText = ifaceData[ID_MAC];
            // Set enable state.
            document.getElementById(iface + FIELD_ENABLE).checked = enabled;
            // Set IP mode.
            if (ipMode == 0)
                document.getElementById(iface + FIELD_IP_MODE).value = IP_MODE_STATIC;
            else
                document.getElementById(iface + FIELD_IP_MODE).value = IP_MODE_DHCP;
            // Fill the rest of the fields.
            document.getElementById(iface + FIELD_IP_ADDRESS).value = ifaceData[ID_IP];
            document.getElementById(iface + FIELD_SUBNET_MASK).value = ifaceData[ID_NETMASK];
            document.getElementById(iface + FIELD_DEFAULT_GATEWAY).value = ifaceData[ID_GATEWAY];
            document.getElementById(iface + FIELD_DNS1_ADDRESS).value = ifaceData[ID_DNS1];
            document.getElementById(iface + FIELD_DNS2_ADDRESS).value = ifaceData[ID_DNS2];
            // Specific Wifi fields.
            if (iface.startsWith(PREFIX_WIFI)) {
                document.getElementById(iface + FIELD_SSID).value = ifaceData[ID_SSID];
                document.getElementById(iface + FIELD_ENCRYPTION_TYPE).selectedIndex = ifaceData[ID_SECURITY_MODE];
                if (ifaceData[ID_SECURITY_MODE] != 0)
                    document.getElementById(iface + FIELD_PASSWORD).value = "dummy_password";
                passwordChanged = false;
            }
            // Update controls.
            updateInterfaceControls(iface);
        }
    }
    // Update interfaces visibility.
    if (parseElement == ALL_ELEMENTS) {
        if (numEthernetIfaces == 1) {
            document.getElementById(IFACE_ETH1).style.display = "none";
            document.getElementById(ID_ETH0_TITLE).innerHTML = "Ethernet";
        }
        if (numWifiIfaces == 0)
            document.getElementById(IFACE_WIFI).style.display = "none";
    }
    // Flag reading variable.
    readingNetworkInfo = false;
    // Hide the loading panel.
    showLoadingPopup(false);
}

// Updates all controls of the page.
function updateAllControls() {
    updateInterfaceControls(IFACE_ETH0);
    updateInterfaceControls(IFACE_ETH1);
    updateInterfaceControls(IFACE_WIFI);
}

// Updates the given interface controls based on its configuration.
function updateInterfaceControls(iface) {
    // Initialize variables.
    var ipGroup = document.getElementById(iface + FIELD_IP_ADDRESS + FIELD_PARAM);
    var ipField = document.getElementById(iface + FIELD_IP_ADDRESS);
    var subnetGroup = document.getElementById(iface + FIELD_SUBNET_MASK + FIELD_PARAM);
    var subnetField = document.getElementById(iface + FIELD_SUBNET_MASK);
    var gatewayGroup = document.getElementById(iface + FIELD_DEFAULT_GATEWAY + FIELD_PARAM);
    var gatewayField = document.getElementById(iface + FIELD_DEFAULT_GATEWAY);
    var dns1Group = document.getElementById(iface + FIELD_DNS1_ADDRESS + FIELD_PARAM);
    var dns1Field = document.getElementById(iface + FIELD_DNS1_ADDRESS);
    var dns2Group = document.getElementById(iface + FIELD_DNS2_ADDRESS + FIELD_PARAM);
    var dns2Field = document.getElementById(iface + FIELD_DNS2_ADDRESS);
    var ipModeGroup = document.getElementById(iface + FIELD_IP_MODE + FIELD_PARAM);
    var ipModeField = document.getElementById(iface + FIELD_IP_MODE);
    var enableField = document.getElementById(iface + FIELD_ENABLE);
    var enabled = enableField.checked;
    var ipMode = ipModeField.value;
    var ssidGroup, encryptionTypeGroup, encryptionTypeField, passwordGroup, usePassword;
    if (iface.startsWith(PREFIX_WIFI)) {
        ssidGroup = document.getElementById(iface + FIELD_SSID + FIELD_PARAM);
        encryptionTypeGroup = document.getElementById(iface + FIELD_ENCRYPTION_TYPE + FIELD_PARAM);
        encryptionTypeField = document.getElementById(iface + FIELD_ENCRYPTION_TYPE);
        passwordGroup = document.getElementById(iface + FIELD_PASSWORD + FIELD_PARAM);
        usePassword = encryptionTypeField.value != 0;
        if (usePassword)
            passwordGroup.style.display = "block";
        else
            passwordGroup.style.display = "none";
    }
    // Determine if IP fields can be edited.
    if (ipMode == IP_MODE_DHCP) {
        if (!ipField.classList.contains(CLASS_INPUT_DISABLED))
            ipField.classList.add(CLASS_INPUT_DISABLED);
        if (!subnetField.classList.contains(CLASS_INPUT_DISABLED))
            subnetField.classList.add(CLASS_INPUT_DISABLED);
        if (!gatewayField.classList.contains(CLASS_INPUT_DISABLED))
            gatewayField.classList.add(CLASS_INPUT_DISABLED);
        if (!dns1Field.classList.contains(CLASS_INPUT_DISABLED))
            dns1Field.classList.add(CLASS_INPUT_DISABLED);
        if (!dns2Field.classList.contains(CLASS_INPUT_DISABLED))
            dns2Field.classList.add(CLASS_INPUT_DISABLED);
    } else if (ipMode == IP_MODE_STATIC) {
        if (ipField.classList.contains(CLASS_INPUT_DISABLED))
            ipField.classList.remove(CLASS_INPUT_DISABLED);
        if (subnetField.classList.contains(CLASS_INPUT_DISABLED))
            subnetField.classList.remove(CLASS_INPUT_DISABLED);
        if (gatewayField.classList.contains(CLASS_INPUT_DISABLED))
            gatewayField.classList.remove(CLASS_INPUT_DISABLED);
        if (dns1Field.classList.contains(CLASS_INPUT_DISABLED))
            dns1Field.classList.remove(CLASS_INPUT_DISABLED);
        if (dns2Field.classList.contains(CLASS_INPUT_DISABLED))
            dns2Field.classList.remove(CLASS_INPUT_DISABLED);
    }
    // Validate the network interface.
    validateInterface(iface);
}

// Validates the given network interface.
function validateInterface(iface) {
    // Initialize vars.
    var valid = true;
    var saveButton = document.getElementById(iface + FIELD_SAVE_BUTTON);
    var enableField = document.getElementById(iface + FIELD_ENABLE);
    var ipModeField = document.getElementById(iface + FIELD_IP_MODE);
    var ipField = document.getElementById(iface + FIELD_IP_ADDRESS);
    var subnetField = document.getElementById(iface + FIELD_SUBNET_MASK);
    var gatewayField = document.getElementById(iface + FIELD_DEFAULT_GATEWAY);
    var dns1Field = document.getElementById(iface + FIELD_DNS1_ADDRESS);
    var dns2Field = document.getElementById(iface + FIELD_DNS2_ADDRESS);
    var ipMode = ipModeField.value;
    var forceValid = false;
    // Validate fields.
    if (ipMode == IP_MODE_DHCP)
        forceValid = true;
    valid &= validateIPField(iface + FIELD_IP_ADDRESS, iface + FIELD_IP_ADDRESS + FIELD_ERROR, forceValid);
    valid &= validateIPField(iface + FIELD_SUBNET_MASK, iface + FIELD_SUBNET_MASK + FIELD_ERROR, forceValid);
    valid &= validateIPField(iface + FIELD_DEFAULT_GATEWAY, iface + FIELD_DEFAULT_GATEWAY + FIELD_ERROR, forceValid);
    valid &= validateIPField(iface + FIELD_DNS1_ADDRESS, iface + FIELD_DNS1_ADDRESS + FIELD_ERROR, forceValid);
    valid &= validateIPField(iface + FIELD_DNS2_ADDRESS, iface + FIELD_DNS2_ADDRESS + FIELD_ERROR, forceValid);
    if (iface.startsWith(PREFIX_WIFI)) {
        valid &= validateField(iface + FIELD_SSID, iface + FIELD_SSID + FIELD_ERROR, REGEX_SSID, ERROR_SSID_INVALID, false);
        if (parseInt(document.getElementById(iface + FIELD_ENCRYPTION_TYPE).value) != 0)
            valid &= validateField(iface + FIELD_PASSWORD, iface + FIELD_PASSWORD + FIELD_ERROR, REGEX_PASSWORD, ERROR_PASSWORD_INVALID, false);
    }
    // Check errors.
    if (!valid) {
        if (!saveButton.classList.contains(CLASS_CONFIG_BUTTON_DISABLED))
            saveButton.classList.add(CLASS_CONFIG_BUTTON_DISABLED);
    } else {
        if (saveButton.classList.contains(CLASS_CONFIG_BUTTON_DISABLED))
            saveButton.classList.remove(CLASS_CONFIG_BUTTON_DISABLED);
    }
}

// Validates the given IP field.
function validateIPField(fieldID, errorID, forceValid) {
    return validateField(fieldID, errorID, REGEX_IP, ERROR_IP_VALUE_FORMAT, forceValid);
}

// Validates the given field.
function validateField(fieldID, errorID, regexPattern, errorMessage, forceValid) {
    // Initialize vars.
    var field = document.getElementById(fieldID);
    var fieldError = document.getElementById(errorID);
    var isValid = true;
    var error = "";
    // Sanity checks.
    if (field == null || fieldError == null)
        return false;
    // Check if value is valid.
    if (!forceValid) {
        var value = field.value;
        if (value.length == 0) {
            isValid = false;
            error = ERROR_FIELD_EMPTY;
        } else if (!value.match(regexPattern)) {
            isValid = false;
            error = errorMessage;
        }
    }
    // Update controls.
    if (isValid) {
        if (field.classList.contains(CLASS_INPUT_ERROR))
            field.classList.remove(CLASS_INPUT_ERROR);
        fieldError.innerHTML = "&nbsp;";
        fieldError.style.display = "none";
    } else {
        if (!field.classList.contains(CLASS_INPUT_ERROR))
            field.classList.add(CLASS_INPUT_ERROR);
        fieldError.innerHTML = error;
        fieldError.style.display = "block";
    }
    return isValid;
}

// Retrieves the given network interface form data.
function getInterfaceData(element, iface) {
    // Initialize variables.
    var data = {};
    var ifaceData = {};
    var networkData = {};
    var enable = document.getElementById(iface + FIELD_ENABLE).checked;
    var ipMode = document.getElementById(iface + FIELD_IP_MODE).value;
    // Fill network data.
    networkData[ID_ENABLE] = enable;
    if (ipMode == IP_MODE_STATIC) {
        networkData[ID_IP_MODE] = 0;
        networkData[ID_IP] = document.getElementById(iface + FIELD_IP_ADDRESS).value;
        networkData[ID_NETMASK] = document.getElementById(iface + FIELD_SUBNET_MASK).value;
        networkData[ID_GATEWAY] = document.getElementById(iface + FIELD_DEFAULT_GATEWAY).value;
        networkData[ID_DNS1] = document.getElementById(iface + FIELD_DNS1_ADDRESS).value;
        networkData[ID_DNS2] = document.getElementById(iface + FIELD_DNS2_ADDRESS).value;
    } else {
        networkData[ID_IP_MODE] = 1;
    }
    if (iface.startsWith(PREFIX_WIFI)) {
        networkData[ID_SSID] = document.getElementById(iface + FIELD_SSID).value;
        networkData[ID_SECURITY_MODE] = parseInt(document.getElementById(iface + FIELD_ENCRYPTION_TYPE).value);
        if (networkData[ID_SECURITY_MODE] != 0 && passwordChanged)
            networkData[ID_PASSWORD] = document.getElementById(iface + FIELD_PASSWORD).value;
    }
    ifaceData[iface] = networkData;
    data[element] = ifaceData;
    return data;
}

// Saves the network settings for the given interface.
function saveInterface(element, iface) {
    // Execute only in the network page.
    if (!isNetworkShowing())
        return;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_SAVING_CONFIGURATION);
    // Send request to set new configuration.
    $.post(
        "http://" + getServerAddress() + "/ajax/set_config",
        JSON.stringify({
            "configuration": getInterfaceData(element, iface)
        }),
        function(data) {
            // Process only in the network page.
            if (!isNetworkShowing())
                return;
            // Process answer.
            processSaveInterfaceResponse(data, element, iface);
        }
    ).fail(function(response) {
        // Process only in the network page.
        if (!isNetworkShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the save network request response.
function processSaveInterfaceResponse(response, element, iface) {
    // Check for error in the response.
    if (!checkErrorResponse(response, false)) {
        var statusFound = false;
        // Check status in the response.
        if (response[ID_DATA] != null) {
            data = JSON.parse(response[ID_DATA]);
            for (const [elementEntry, elementData] of Object.entries(data)) {
                if (elementEntry != element)
                    continue;
                for (const [ifaceEntry, ifaceData] of Object.entries(elementData)) {
                    if (ifaceEntry != iface)
                        continue;
                    if (ifaceData[ID_STATUS] != null) {
                        statusFound = true;
                        if (ifaceData[ID_STATUS] != 0)
                            toastr.error(ifaceData[ID_DESC]);
                        else
                            toastr.success(MESSAGE_CONFIGURATION_SAVED);
                    }
                }
            }
        }
        if (!statusFound)
            toastr.error(ERROR_UNKNOWN);
    }
    // Hide the loading panel.
    showLoadingPopup(false);
}

// Toggles the visibility of the given interface panel.
function togglePanelVisibility(interface) {
    // Initialize variables.
    var panelButton = document.getElementById(interface + ID_TOGGLE_BUTTON);
    // Sanity checks.
    if (panelButton == null)
        return;
    // Check visibility.
    if (panelButton.classList.contains(CLASS_ARROW_UP)) {
        $("#" + interface + ID_PANEL_CONTAINER).slideUp("fast", function() {
            panelButton.classList.remove(CLASS_ARROW_UP);
            panelButton.classList.add(CLASS_ARROW_DOWN);
        });
    } else {
        $("#" + interface + ID_PANEL_CONTAINER).slideDown("fast", function() {
            panelButton.classList.remove(CLASS_ARROW_DOWN);
            panelButton.classList.add(CLASS_ARROW_UP);
        });
    }
}