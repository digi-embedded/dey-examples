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
const ID_AREA = "area";
const ID_AREA_HEIGHT = "area-height";
const ID_AREA_LEFT_MARGIN = "area-left-margin";
const ID_AREA_TOP_MARGIN = "area-top-margin";
const ID_AREA_WIDTH = "area-width";
const ID_ARROW = "arrow";
const ID_ARROW_MARGIN = "arrow-margin";
const ID_AUDIO = "audio";
const ID_BLUETOOTH_MAC = "bluetooth_mac";
const ID_BOARD_ID = "board_id";
const ID_BOARD_VARIANT = "board_variant";
const ID_BT_READ_DATA = "bluetooth_received_data";
const ID_BT_SENT_DATA = "bluetooth_sent_data";
const ID_BT_STATE = "bluetooth_state";
const ID_CONSOLE = "console";
const ID_CONFIRM_DIALOG = "confirm_dialog";
const ID_CONFIRM_DIALOG_MESSAGE = "confirm_dialog_message";
const ID_CONFIRM_DIALOG_NO_BUTTON = "confirm_dialog_no_button";
const ID_CONFIRM_DIALOG_TITLE = "confirm_dialog_title";
const ID_CONFIRM_DIALOG_YES_BUTTON = "confirm_dialog_yes_button";
const ID_CPU = "cpu";
const ID_CPU_FREQUENCY = "cpu_frequency";
const ID_CPU_LOAD = "cpu_load";
const ID_CPU_TEMPERATURE = "cpu_temperature";
const ID_CPU_UPTIME = "cpu_uptime";
const ID_CURRENT_DIR = "current_dir";
const ID_DATA = "data";
const ID_DATA_USAGE_DEVICES = "data_usage_devices";
const ID_DATA_USAGE_MONITORS = "data_usage_monitors";
const ID_DATA_USAGE_TOTAL = "data_usage_total";
const ID_DATA_USAGE_WEB = "data_usage_web";
const ID_DATA_USAGE_WEB_SERVICES = "data_usage_web_services";
const ID_DEVICE_ID = "device_id";
const ID_DEVICE_NAME = "device_name";
const ID_DEVICE_TYPE = "device_type";
const ID_DEVICES = "devices";
const ID_DEY_VERSION = "dey_version";
const ID_ERROR = "error";
const ID_ERROR_GUIDE = "error_guide";
const ID_ERROR_MESSAGE = "error_msg";
const ID_ERROR_TITLE = "error_title";
const ID_ETHERNET = "ethernet";
const ID_ETHERNET_IP = "ethernet_ip";
const ID_ETHERNET_MAC = "ethernet_mac";
const ID_ETHERNET_READ_DATA = "ethernet_received_data";
const ID_ETHERNET_SENT_DATA = "ethernet_sent_data";
const ID_ETHERNET_STATE = "ethernet_state";
const ID_FILES = "files";
const ID_FLASH_MEMORY = "flash_memory";
const ID_FLASH_SIZE = "flash_size";
const ID_HAS_ARROW = "has-arrow";
const ID_HAS_PANEL = "has-panel";
const ID_ICON = "icon";
const ID_ID = "id";
const ID_INFO_POPUP = "info_popup";
const ID_INFO_POPUP_MESSAGE = "info_popup_message";
const ID_INFO_POPUP_TITLE = "info_popup_title";
const ID_KERNEL_VERSION = "kernel_version";
const ID_LAST_MODIFIED = "last_modified";
const ID_LED = "led";
const ID_LOADING_POPUP = "loading_popup";
const ID_LOADING_POPUP_MESSAGE = "loading_popup_message";
const ID_LOADING_WRAPPER = "loading_wrapper";
const ID_MCA_FW_VERSION = "mca_fw_version";
const ID_MCA_HW_VERSION = "mca_hw_version";
const ID_MEMORY = "memory";
const ID_MEMORY_FREE = "memory_free";
const ID_MEMORY_TOTAL = "memory_total";
const ID_MEMORY_USED = "memory_used";
const ID_MESSAGE = "message";
const ID_MODULE_VARIANT = "module_variant";
const ID_NAME = "name";
const ID_NUM_SAMPLES_UPLOAD = "num_samples_upload";
const ID_ONLINE = "online";
const ID_PANEL = "panel";
const ID_PANEL_ALWAYS_VISIBLE = "panel-always-visible";
const ID_PANEL_HORIZONTAL_MARGIN = "panel-horizontal-margin";
const ID_PANEL_ORIENTATION = "panel-orientation";
const ID_PANEL_VERTICAL_MARGIN = "panel-vertical-margin";
const ID_PATH = "path";
const ID_PROGRESS = "progress";
const ID_SAMPLE_RATE = "sample_rate";
const ID_SERIAL_NUMBER = "serial_number";
const ID_SESSION_ID = "session_id";
const ID_SIZE = "size";
const ID_STATUS = "status";
const ID_STREAM = "stream";
const ID_TIMESTAMP = "timestamp";
const ID_TYPE = "type";
const ID_UBOOT_VERSION = "uboot_version";
const ID_USAGE = "usage";
const ID_VALUE = "value";
const ID_VIDEO = "video";
const ID_VIDEO_RESOLUTION = "video_resolution";
const ID_VISIBLE = "visible";
const ID_WIFI_BT = "wifi-bt";
const ID_WIFI_IP = "wifi_ip";
const ID_WIFI_MAC = "wifi_mac";
const ID_WIFI_READ_DATA = "wifi_received_data";
const ID_WIFI_SENT_DATA = "wifi_sent_data";
const ID_WIFI_STATE = "wifi_state";

const VALUE_ACTIVE = "active";
const VALUE_ABORT = "abort";
const VALUE_BOTTOM = "bottom";
const VALUE_CANCELED = "canceled";
const VALUE_FAILED = "failed";
const VALUE_LEFT = "left";
const VALUE_OFF = "Off";
const VALUE_OFFLINE = "Offline";
const VALUE_ON = "On";
const VALUE_ONLINE = "Online";
const VALUE_RIGHT = "right";
const VALUE_SUCCESSFUL = "successful";
const VALUE_TOP = "top";
const VALUE_UNKNOWN = "unknown";

const CLASS_D_NONE = "d-none";
const CLASS_DISABLED_DIV = "disabled-div";
const CLASS_ELEMENT_GRAYED = "element-grayed";
const CLASS_SELECTED = "selected";

const ERROR_ABORTED = "Operation aborted";
const ERROR_URL_NOT_FOUND = "Requested URL not found";
const ERROR_SERVER_ERROR = "Internal server error";
const ERROR_TITLE = "Error";
const ERROR_UNKNOWN_ERROR = "Unknown error";

const IMAGE_OFFLINE = "status_offline.png";
const IMAGE_ONLINE = "status_online.png";

const PATH_IMAGES = "../static/images/";

String.prototype.format = function() {
    var formatted = this;
    for (var arg in arguments)
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    return formatted;
};

// Shows/hides a front popup over the given background element.
function showPopup(backElementID, frontElementID, visible) {
    // Initialize variables.
    var backElement = document.getElementById(backElementID);
    var frontElement = document.getElementById(frontElementID);
    // Sanity checks.
    if (backElement == null || frontElement == null)
        return;
    // Show/Hide the popup.
    if (visible) {
        if (!backElement.classList.contains(CLASS_ELEMENT_GRAYED))
            backElement.classList.add(CLASS_ELEMENT_GRAYED);
        if (frontElement.classList.contains(CLASS_D_NONE))
            frontElement.classList.remove(CLASS_D_NONE);
    } else {
        if (backElement.classList.contains(CLASS_ELEMENT_GRAYED))
            backElement.classList.remove(CLASS_ELEMENT_GRAYED);
        if (!frontElement.classList.contains(CLASS_D_NONE))
            frontElement.classList.add(CLASS_D_NONE);
    }
}

// Redirects to the login page.
function redirectToLogin() {
    var url = "/access/login?dest=" + window.location.pathname.replaceAll("/", "");
    var params = new URLSearchParams(window.location.search);
    for (let param of params)
        url += "&" + param[0] + "=" + param[1];
    window.location.href = url;
}

// Processes the error response of the AJAX request.
function processAjaxErrorResponse(response) {
    // Check common error codes.
    if (response.status == 401)
        redirectToLogin();
    var errorMessage = "";
    if (response.statusText == VALUE_ABORT)
        errorMessage = ERROR_ABORTED;
    else if (response.status == 400) {
        errorMessage = response.responseJSON[ID_ERROR];
        // Show the error message (if any).
        if (errorMessage == null)
            errorMessage = ERROR_UNKNOWN_ERROR;
    } else if (response.status == 404)
        errorMessage = ERROR_URL_NOT_FOUND;
    else if (response.status == 500)
        errorMessage = ERROR_SERVER_ERROR;
    else
        errorMessage = ERROR_UNKNOWN_ERROR;
    // Show toast with the error message.
    toastr.error(errorMessage);
    // Return the error message.
    return errorMessage;
}

// Check if there is any error in the response.
function checkErrorResponse(response, showErrorDialog) {
    if (response[ID_ERROR_MESSAGE] != null || response[ID_ERROR] != null) {
        // Process error.
        var errorTitle = ERROR_TITLE;
        var errorMessage = getErrorFromResponse(response);
        if (response[ID_ERROR_TITLE] != null)
            errorTitle = response[ID_ERROR_TITLE];
        // Show toast error.
        if (errorMessage != null && errorMessage != "")
            toastr.error(errorMessage);
        // Hide the loading panel.
        showLoadingPopup(false);
        // Show error dialog.
        if (showErrorDialog)
            showInfoPopup(true, errorTitle, errorMessage);
        // There was an error, return true.
        return true;
    }
    // No error found.
    return false;
}

// Returns the error message from the response.
function getErrorFromResponse(response) {
    var error = "";
    if (response[ID_ERROR_MESSAGE] != null || response[ID_ERROR] != null) {
        if (response[ID_ERROR_MESSAGE] != null) {
            error = response[ID_ERROR_MESSAGE];
            if (response[ID_ERROR_GUIDE] != null)
                error += response[ID_ERROR_GUIDE];
        } else
            error = response[ID_ERROR];
    }
    return error;
}

// Shows/hides the loading popup panel.
function showLoadingPopup(visible, message=null) {
    // Set loading message only if it is not null and the popup will be visible.
    if (visible && message != null)
        document.getElementById(ID_LOADING_POPUP_MESSAGE).innerHTML = message;
    // Show/Hide the popup.
    showPopup(ID_LOADING_WRAPPER, ID_LOADING_POPUP, visible);
}

// Shows/hides the info popup panel.
function showInfoPopup(visible, tittle=null, message=null) {
    // Set title and message.
    if (visible && tittle != null && message != null) {
        // Initialize vars.
        var infoPopupTittleElement = document.getElementById(ID_INFO_POPUP_TITLE);
        var infoPopupMessageElement = document.getElementById(ID_INFO_POPUP_MESSAGE);
        // Set the info title.
        if (infoPopupTittleElement != null)
            infoPopupTittleElement.innerHTML = tittle;
        // Set the info message.
        if (infoPopupMessageElement != null)
            infoPopupMessageElement.innerHTML = message;
    }
    // Show/Hide the popup.
    showPopup(ID_LOADING_WRAPPER, ID_INFO_POPUP, visible);
}

// Shows the confirm dialog.
function showConfirmDialog(title, message, yesCallback, noCallback) {
    // Initialize variables.
    var confirmDialogTitleElement = document.getElementById(ID_CONFIRM_DIALOG_TITLE);
    var confirmDialogMessageElement = document.getElementById(ID_CONFIRM_DIALOG_MESSAGE);
    var confirmDialogYesButtonElement = document.getElementById(ID_CONFIRM_DIALOG_YES_BUTTON);
    var confirmDialogNoButtonElement = document.getElementById(ID_CONFIRM_DIALOG_NO_BUTTON);
    // Check if the elements are valid.
    if (confirmDialogTitleElement != null && confirmDialogMessageElement != null &&
        confirmDialogYesButtonElement != null && confirmDialogNoButtonElement != null) {
        // Set the dialog title.
        confirmDialogTitleElement.innerHTML = title;
        // Set the dialog message.
        confirmDialogMessageElement.innerHTML = message;
        // Show the dialog.
        showPopup(ID_LOADING_WRAPPER, ID_CONFIRM_DIALOG, true);
        // Set the yes button callback.
        confirmDialogYesButtonElement.onclick = function() {
            // Hide the dialog.
            showPopup(ID_LOADING_WRAPPER, ID_CONFIRM_DIALOG, false);
            // Call the callback.
            if (yesCallback != null)
                yesCallback();
        };
        // Set the no button callback.
        confirmDialogNoButtonElement.onclick = function() {
            // Hide the dialog.
            showPopup(ID_LOADING_WRAPPER, ID_CONFIRM_DIALOG, false);
            // Call the callback.
            if (noCallback != null)
                noCallback();
        };
    }
}

// Transforms the given ISO8601 date to human readable date.
function transformDate(iso8601Date) {
    // Initialize variables.
    var date = new Date(iso8601Date);
    var humanReadableDate = "";
    // Check if the date is valid.
    if (date != null) {
        // Transform the date to human readable date.
        humanReadableDate = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours().toString().padStart(2, '0') + ":" + date.getMinutes().toString().padStart(2, '0');
    }
    // Return the human readable date.
    return humanReadableDate;
}

// Transforms the given kilo-bytes to mega-bytes
function kiloBytesToMegaBytes(kiloBytes) {
    return (kiloBytes / 1024).toFixed(2);
}

// Format bytes as human-readable text.
function sizeToHumanRead(bytes, si=true, dp=2) {
    // Initialize variables.
    var threshold = si ? 1000 : 1024;
    var units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var unit = -1;
    // Check if minimum threshold is reached.
    if (Math.abs(bytes) < threshold)
        return bytes + ' Bytes';

    const r = 10**dp;
    do {
        bytes /= threshold;
        ++unit;
    } while (Math.round(Math.abs(bytes) * r) / r >= threshold && unit < units.length - 1);

    return bytes.toFixed(dp) + ' ' + units[unit];
}

// Rounds the given number to two decimals.
function roundToTwoDecimals(number) {
    return Math.round(number * 100) / 100;
}

// Returns human readable time from the given seconds.
function secondsToTime(numSeconds) {
    // Initialize variables.
    var days = 0;
    var hours = 0;
    var minutes = 0;
    var seconds = 0;
    // Calculate the time values.
    if (numSeconds < 60)
        seconds = numSeconds;
    else if (numSeconds < (60 * 60)) {
        minutes = Math.floor(numSeconds / 60);
        seconds = numSeconds % 60;
    } else if (numSeconds < (60 * 60 * 24)) {
        hours = Math.floor(numSeconds / (60 * 60));
        minutes = Math.floor((numSeconds % (60 * 60)) / 60);
        seconds = numSeconds % 60;
    } else {
        days = Math.floor(numSeconds / (60 * 60 * 24));
        hours = Math.floor((numSeconds % (60 * 60 * 24)) / (60 * 60));
        minutes = Math.floor((numSeconds % (60 * 60)) / 60);
        seconds = numSeconds % 60;
    }
    // Build time string.
    var time = "";
    var numFields = 0;
    if (days > 0) {
        time += days + " day";
        if (days > 1)
            time += "s";
        time += " ";
        numFields += 1;
    }
    if (hours > 0) {
        time += hours + " hour";
        if (hours > 1)
            time += "s";
        time += " ";
        numFields += 1;
    }
    if (minutes > 0 && numFields < 2) {
        time += minutes + " minute";
        if (minutes > 1)
            time += "s";
        time += " ";
        numFields += 1;
    }
    if ((seconds > 0 && numFields < 2) || time == "") {
        time += seconds + " second";
        if (seconds > 1)
            time += "s";
    }
    // Return the time string.
    return time;
}

// Returns on/off status from the given integer.
function onOffStatus(status) {
    return status == 1 ? VALUE_ON : VALUE_OFF;
}

// Updates the given field ID with the given value.
function updateFieldValue(fieldID, value) {
    var fieldElement = document.getElementById(fieldID);
    if (fieldElement != null && fieldElement != "undefined")
        fieldElement.innerText = value;
}

// Rounds the given amount of kilo-bytes to giga bytes.
function roundToGigaBytes(kiloBytes) {
    return (kiloBytes / (1024 * 1024)).toFixed(2);
}

// Returns whether the dashboard page is showing or not.
function isDashboardShowing() {
    return window.location.pathname.indexOf("dashboard") > -1;
}

// Returns whether the management page is showing or not.
function isManagementShowing() {
    return window.location.pathname.indexOf("management") > -1;
}

// Returns whether the history page is showing or not.
function isHistoryShowing() {
    return window.location.pathname.indexOf("history") > -1;
}

// Returns the device ID.
function getDeviceID() {
    return new URLSearchParams(window.location.search).get(ID_DEVICE_ID);
}

// Returns the device name.
function getDeviceName() {
    return new URLSearchParams(window.location.search).get(ID_DEVICE_NAME);
}
