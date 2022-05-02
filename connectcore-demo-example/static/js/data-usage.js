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
const ID_DATA_USAGE_BUTTON = "data_usage_button";
const ID_DATA_USAGE_CURRENT_DEVICE = "data_usage_current_device";
const ID_DATA_USAGE_GRAPHIC_WEB = "data_usage_graphic_web";
const ID_DATA_USAGE_GRAPHIC_DEVICES = "data_usage_graphic_devices";
const ID_DATA_USAGE_ICON = "data_usage_icon";
const ID_DATA_USAGE_LOADING = "data_usage_loading";
const ID_DATA_USAGE_PANEL = "data_usage_panel";

// Returns whether the data usage panel is open or not.
function isDataUsageShowing() {
    // Initialize variables.
    var dataUsagePanel = document.getElementById(ID_DATA_USAGE_PANEL);
    // Return visibility.
    return dataUsagePanel.style.display != "none";
}

// Toggles the data usage panel visibility.
function toggleDataUsagePanel() {
    // Initialize variables.
    var dataUsageIcon = document.getElementById(ID_DATA_USAGE_ICON);
    var dataUsageButton = document.getElementById(ID_DATA_USAGE_BUTTON);
    // Avoid double clicks.
    dataUsageButton.style.pointerEvents = "none";
    // Check data usage panel visibility.
    if (isDataUsageShowing()) {
        $("#" + ID_DATA_USAGE_PANEL).slideUp("fast", function() {
            dataUsageIcon.src = "../static/images/data_usage.png";
            // Enable hover effect.
            $("#" + ID_DATA_USAGE_BUTTON).on({
                "mouseover" : function() {
                    dataUsageIcon.src = "../static/images/data_usage_green.png";
                },
                "mouseout" : function() {
                    dataUsageIcon.src = "../static/images/data_usage.png";
                }
            });
            // React to mouse events again.
            dataUsageButton.style.pointerEvents = "auto";
            // Reset fields.
            clearDataUsageFields();
        });
    } else {
        $("#" + ID_DATA_USAGE_PANEL).slideDown("fast", function() {
            dataUsageIcon.src = "../static/images/data_usage_green.png";
            // Disable hover effect.
            $("#" + ID_DATA_USAGE_BUTTON).on({
                "mouseover" : function() {
                    dataUsageIcon.src = "../static/images/data_usage_green.png";
                },
                "mouseout" : function() {
                    dataUsageIcon.src = "../static/images/data_usage_green.png";
                }
            });
            // React to mouse events again.
            dataUsageButton.style.pointerEvents = "auto";
            // Read data usage.
            readDataUsage();
        });
    }
}

// Reads the DRM account data usage.
function readDataUsage() {
    // Sanity checks.
    if (!isDataUsageShowing())
        return;
    // Show the data usage loading panel.
    showDataUsageLoading(true);
    // Send request to change the LED status.
    $.post(
        "../ajax/get_data_usage",
        function(data) {
            // Process only if the panel is showing.
            if (!isDataUsageShowing())
                return;
            // Process answer.
            processReadDataUsageResponse(data);
        }
    ).fail(function(response) {
        // Process only if the panel is showing.
        if (!isDataUsageShowing())
            return;
        // Process error.
        error = processAjaxErrorResponse(response);
        // Hide the data usage loading panel.
        showDataUsageLoading(true);
    });
}

// Processes the read data usage response.
function processReadDataUsageResponse(response) {
    // Hide the data usage loading panel.
    showDataUsageLoading(false);
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Update the data usage values.
        updateDataUsageValues(response);
    }
}

// Updates the data usage values.
function updateDataUsageValues(response) {
    // Sanity checks.
    if (!isDataUsageShowing())
        return;
    // Initialize variables.
    var dataUsageTotal = response[ID_DATA_USAGE_TOTAL];
    var dataUsageWeb = response[ID_DATA_USAGE_WEB];
    var dataUsageDevices = response[ID_DATA_USAGE_DEVICES];
    var dataUsageDevicesPercent = 0;
    var dataUsageWebPercent = 0;
    var dataUsageCurrentDevice = 0;
    var graphicDevicesElement = document.getElementById(ID_DATA_USAGE_GRAPHIC_DEVICES);
    var graphicWebElement = document.getElementById(ID_DATA_USAGE_GRAPHIC_WEB);
    // Calculate percent for data devices.
    if (dataUsageTotal > 0) {
        dataUsageDevicesPercent = Math.round(dataUsageDevices * 100 / dataUsageTotal);
        dataUsageWebPercent = Math.round(dataUsageWeb * 100 / dataUsageTotal);
    }
    // Calculate values for totals.
    dataUsageDevices = sizeToHumanRead(dataUsageDevices * 1000 * 1000);  // This usage is given in MB.
    dataUsageWeb = sizeToHumanRead(dataUsageWeb * 1000 * 1000);  // This usage is given in MB.
    // Retrieve the data usage for the current device.
    for (var device in response[ID_DEVICES]) {
        if (response[ID_DEVICES][device][ID_DEVICE_ID].toLowerCase() == getDeviceID().toLowerCase()) {
            dataUsageCurrentDevice = response[ID_DEVICES][device][ID_USAGE];
            break;
        }
    }
    // Set percentage size of graphics.
    graphicDevicesElement.style.width = dataUsageDevicesPercent + "%";
    graphicWebElement.style.width = dataUsageWebPercent + "%";
    // Set graphics tooltips.
    graphicDevicesElement.setAttribute("data-original-title", "Total data usage by devices: " + dataUsageDevices + " (" + dataUsageDevicesPercent + "%)");
    graphicWebElement.setAttribute("data-original-title", "Total data usage by web APIs: " + dataUsageWeb + " (" + dataUsageWebPercent + "%)");
    // Update the data usage values.
    updateFieldValue(ID_DATA_USAGE_TOTAL, sizeToHumanRead(dataUsageTotal * 1000 * 1000));  // This usage is given in MB.
    updateFieldValue(ID_DATA_USAGE_DEVICES, dataUsageDevices);
    updateFieldValue(ID_DATA_USAGE_CURRENT_DEVICE, sizeToHumanRead(dataUsageCurrentDevice * 1000));  // This usage is given in KB.
    updateFieldValue(ID_DATA_USAGE_WEB, dataUsageWeb);
    updateFieldValue(ID_DATA_USAGE_WEB_SERVICES, sizeToHumanRead(response[ID_DATA_USAGE_WEB_SERVICES] * 1000));  // This usage is given in KB.
    updateFieldValue(ID_DATA_USAGE_MONITORS, sizeToHumanRead(response[ID_DATA_USAGE_MONITORS] * 1000));  // This usage is given in KB.
}

// Shows/hides the data usage loading panel.
function showDataUsageLoading(visible) {
    // Sanity checks.
    if (!isDataUsageShowing())
        return;
    // Initialize variables.
    var dataUsageLoading = document.getElementById(ID_DATA_USAGE_LOADING);
    // Show the data usage loading panel.
    if (visible)
        dataUsageLoading.style.display = "block";
    else
        dataUsageLoading.style.display = "none";
}

// Clears all data usage fields.
function clearDataUsageFields() {
    // Initialize variables.
    var graphicDevicesElement = document.getElementById(ID_DATA_USAGE_GRAPHIC_DEVICES);
    var graphicWebElement = document.getElementById(ID_DATA_USAGE_GRAPHIC_WEB);
    // Clear all data usage fields.
    updateFieldValue(ID_DATA_USAGE_TOTAL, "");
    updateFieldValue(ID_DATA_USAGE_DEVICES, "");
    updateFieldValue(ID_DATA_USAGE_CURRENT_DEVICE, "");
    updateFieldValue(ID_DATA_USAGE_WEB, "");
    updateFieldValue(ID_DATA_USAGE_WEB_SERVICES, "");
    updateFieldValue(ID_DATA_USAGE_MONITORS, "");
    // Reset graphic sizes.
    graphicDevicesElement.style.width = "0%";
    graphicWebElement.style.width = "0%";
}

// Refreshes the usage data.
function refreshUsageData() {
    // Sanity checks.
    if (!isDataUsageShowing())
        return;
    // Clear all data usage fields.
    clearDataUsageFields();
    // Read data usage.
    readDataUsage();
}
