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
const ID_REBOOT_BUTTON = "reboot_button";
const ID_FIRMWARE_TAB_UPLOAD = "firmware_tab_upload";
const ID_FIRMWARE_TAB_UPLOAD_HEADER = "firmware_tab_upload_header";
const ID_SELECT_FIRMWARE_BUTTON = "select_firmware_button";
const ID_UPDATE_FIRMWARE_BUTTON = "update_firmware_button";
const ID_UPDATE_FIRMWARE_FILE = "firmware_file";
const ID_UPDATE_FIRMWARE_FILE_LABEL = "firmware_file_label";
const ID_UPDATE_FIRMWARE_PROGRESS = "update_firmware_progress";
const ID_UPDATE_FIRMWARE_PROGRESS_BAR = "update_firmware_progress_bar";
const ID_UPDATE_FIRMWARE_PROGRESS_MESSAGE = "update_firmware_progress_message";
const ID_UPDATE_FIRMWARE_PROGRESS_TITLE = "update_firmware_progress_title";
const ID_UPDATE_RUNNING = "update_running";

const CLASS_FIRMWARE_TAB = "firmware-tab";
const CLASS_FIRMWARE_TAB_HEADER = "firmware-tab-header";
const CLASS_FIRMWARE_TAB_HEADER_ACTIVE = "firmware-tab-header-active";
const CLASS_PROGRESS_BAR_ERROR = "update-firmware-progress-bar-error";
const CLASS_PROGRESS_BAR_INFO = "update-firmware-progress-bar-info";
const CLASS_PROGRESS_BAR_SUCCESS = "update-firmware-progress-bar-success";

const TITLE_CONFIRM_FIRMWARE_UPDATE = "Confirm firmware update";
const TITLE_CONFIRM_REBOOT = "Confirm reboot";
const TITLE_DEVICE_REBOOTING = "Device Rebooting";
const TITLE_FIRMWARE_UPDATE_ERROR = "Firmware update failed!";
const TITLE_FIRMWARE_UPDATE_IN_PROGRESS = "Firmware update in progress...";
const TITLE_FIRMWARE_UPDATE_SUCCESS = "Firmware update succeeded!";

const MESSAGE_CHECKING_FIRMWARE_UPDATE_STATUS = "Checking firmware update...";
const MESSAGE_CONFIRM_FIRMWARE_UPDATE = "This action will update the device firmware. Do you want to continue?";
const MESSAGE_CONFIRM_REBOOT = "This action will reboot the device and connection will be lost. Do you want to continue?";
const MESSAGE_DEVICE_REBOOTING = "The device is rebooting. Please wait...";
const MESSAGE_LOADING_INFORMATION = "Loading device information...";
const MESSAGE_LOADING_FILES = "Loading files...";
const MESSAGE_NO_FILE_SELECTED = "No file selected";
const MESSAGE_SENDING_FIRMWARE_UPDATE_REQUEST = "Sending firmware update request...";
const MESSAGE_SENDING_REBOOT = "Sending reboot request...";
const MESSAGE_SENDING_UPLOAD_REQUEST = "Sending firmware upload request...";
const MESSAGE_UPLOAD_COMPLETE = "Firmware file upload complete";
const MESSAGE_UPDATING_FIRMWARE = "Updating firmware...";
const MESSAGE_UPLOADING_FIRMWARE = "Uploading firmware file...";

const UPDATE_ERROR = "error";
const UPDATE_INFO = "info";
const UPDATE_SUCCESS = "success";

const FIRMWARE_UPDATE_CHECK_INTERVAL = 10000;

// Variables.
var readingManagementInfo = false;
var managementInfoRead = false;
var deviceRebooting = false;
var updatingFirmware = false;
var firmwareUpdateTimer = null;
var uploadFirmwareAjaxRequest = null;
var fwStorageDir = "/home/root/";

// Initializes the management page.
function initializeManagementPage() {
    // Sanity checks.
    if (!isManagementShowing() || managementInfoRead)
        return;
    // Read management information.
    readDeviceInfoManagement();
}

// Gets the information of the device.
function readDeviceInfoManagement() {
    // Execute only in the management page.
    if (!isManagementShowing() || readingManagementInfo)
        return;
    // Unset device rebooting variable.
    deviceRebooting = false;
    // Flag reading variable.
    readingManagementInfo = true;
    // Hide the info popup.
    showInfoPopup(false);
    // Hide the firmware progress.
    showFirmwareUpdateProgress(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_LOADING_INFORMATION);
    // Send request to retrieve device information.
    $.post(
        "http://" + getServerAddress() + "/ajax/get_device_info",
        function(data) {
            readingManagementInfo = false;
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process device information answer.
            processDeviceInfoManagementResponse(data);
        }
    ).fail(function(response) {
        // Flag reading variable.
        readingManagementInfo = false;
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the device info request.
function processDeviceInfoManagementResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Fill device info.
        fillDeviceInfo(response);
        fwStorageDir = response[ID_FW_STORE_PATH];
        // Flag device info read.
        managementInfoRead = true;
        // Check if there is a firmware update running.
        checkFirmwareUpdateRunning();
    }
}

// Fills device information.
function fillDeviceInfo(deviceData) {
    // Set the device type.
    updateFieldValue(ID_DEVICE_NAME, deviceData[ID_DEVICE_TYPE].toUpperCase());
    // Set DEY version.
    updateFieldValue(ID_DEY_VERSION, deviceData[ID_DEY_VERSION]);
    // Set Kernel version.
    updateFieldValue(ID_KERNEL_VERSION, deviceData[ID_KERNEL_VERSION]);
    // Set U-Boot version.
    updateFieldValue(ID_UBOOT_VERSION, deviceData[ID_UBOOT_VERSION]);
}

// Asks the user to confirm the reboot action.
function askReboot() {
    showConfirmDialog(TITLE_CONFIRM_REBOOT, MESSAGE_CONFIRM_REBOOT,
        function() {
            // Execute the reboot.
            rebootDevice();
        },
        function() {
            // Do nothing.
        }
    );
}

// Reboots the device.
function rebootDevice() {
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_SENDING_REBOOT);
    // Send request to reboot the device.
    $.post(
        "http://" + getServerAddress() + "/ajax/reboot_device",
        function(data) {
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process reboot device answer.
            processRebootDeviceResponse(data);
        }
    ).fail(function(response) {
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

function onConnectivity(cb) {
    $.get("http://" + getServerAddress() + "/ping", function() {
        cb();
    }).fail(function() {
        onConnectivity(cb);
    });
}

function showRebootInfo() {
    // Show info dialog.
    showInfoPopup(true, TITLE_DEVICE_REBOOTING, "Waiting for connectivity after reboot <span class=\"dots\"></span>");
    deviceRebooting = true;
    managementInfoRead = false;
    prevDeviceConnectionStatus = false;

    var dotsInterval = setInterval(function() {
        var dots = $("#info_popup .dots");
        dots.text(dots.text() === "..." ? "" : dots.text() + ".");
    }, 2000);

    setTimeout(function() {
        onConnectivity(function() {
            clearInterval(dotsInterval);
            showInfoPopup(false);
            showPopup(ID_LOADING_WRAPPER, "rebooted_dialog", true);
        });
    }, 2000);
}

// Processes the response of the reboot device request.
function processRebootDeviceResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false))
        showRebootInfo();
}

// Opens the firmware file browser.
function openFirmwareBrowser() {
    if (is_local_access())
        openFileSystem(showButtons=false, filters=".swu");
    else
        document.getElementById(ID_UPDATE_FIRMWARE_FILE).click();
}

// Reads the device status.
function firmwareFileChanged(fileName="") {
    // Execute only in the management page.
    if (!isManagementShowing())
        return;
    closeFileSystem();
    // Initialize variables.
    var firmwareFileElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE);
    var firmwareFileLabelElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE_LABEL);
    // Hide progress bar.
    showFirmwareUpdateProgress(false);
    if (fileName == "" && firmwareFileElement.files.length == 0) {
        // No file selected.
        firmwareFileLabelElement.innerHTML = MESSAGE_NO_FILE_SELECTED;
        enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, false);
        return;
    }
    var firmwareFile = "";
    // Build file path.
    if (is_local_access()) {
        firmwareFile = currentDirectory + fileName;
        // Hide the loading status.
        showFileSystemLoading(false);
    } else {
        firmwareFile = firmwareFileElement.files[0].name;
    }
    // Update firmware file name.
    firmwareFileLabelElement.innerHTML = firmwareFile;
    // Enable button.
    enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, true);
}

// Asks the user to confirm the firmware update action.
function askUpdateFirmware() {
    showConfirmDialog(TITLE_CONFIRM_FIRMWARE_UPDATE, MESSAGE_CONFIRM_FIRMWARE_UPDATE,
        function() {
            // Sanity checks.
            var activeTab = getActiveFirmwareUpdateTab();
            if (activeTab == null)
                return;
            // Flag updating variable.
            updatingFirmware = true;
            // Hide the info popup.
            showInfoPopup(false);
            // Hide the loading popup.
            showLoadingPopup(false);
            // Disable firmware update button.
            enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, false);
            // Show progress bar.
            showFirmwareUpdateProgress(true);
            // Disable management page controls.
            enableManagementPageControls(false);
            // Check active tab.
            if (activeTab == ID_FIRMWARE_TAB_UPLOAD) {
                if (!is_local_access())
                    // Upload firmware.
                    uploadFirmwareFile();
                else
                    updateFirmware(document.getElementById(ID_UPDATE_FIRMWARE_FILE_LABEL).innerHTML);
            }
        },
        function() {
            // Do nothing.
        }
    );
}

// Attempts to upload the given firmware file.
function uploadFirmwareFile() {
    // Initialize variables.
    var firmwareFileElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE);
    var firmwareFile = firmwareFileElement.files[0];
    // Update upload status.
    setFirmwareUpdateProgressInfo(0, MESSAGE_UPLOADING_FIRMWARE);
    // Prepare data.
    var formData = new FormData();
    formData.append("path", fwStorageDir + firmwareFile.name);
    formData.append("file", firmwareFile);
    formData.append("overwrite", true);
    // Send request.
    $.ajax({
        type: 'POST',
        url: "http://" + getServerAddress() + "/ajax/fs_upload_file",
        data: formData,
        cache: false,
        async: true,
        processData: false,
        contentType: false,
        enctype: 'multipart/form-data',
        success: function(response) {
            // Reset request variable.
            uploadFirmwareAjaxRequest = null;
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Process answer.
            processUploadFirmwareFileResponse(response);
        },
        error: function(response) {
            // Reset request variable.
            uploadFirmwareAjaxRequest = null;
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Process error.
            error = processAjaxErrorResponse(response);
            // Update upload status.
            setFirmwareUpdateProgressError(error);
            // Flag updating variable.
            updatingFirmware = false;
            // Enable the management page controls.
            enableManagementPageControls(true);
        }
    });
}

// Processes the upload firmware file response.
function processUploadFirmwareFileResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        error = getErrorFromResponse(response);
        // Update upload status.
        setFirmwareUpdateProgressError(error);
        // Flag updating variable.
        updatingFirmware = false;
        // Enable the management page controls.
        enableManagementPageControls(true);
    } else {
        // Update upload status.
        setFirmwareUpdateProgressInfo(100, MESSAGE_UPLOAD_COMPLETE);
        // Build file path.
        var firmwareFileElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE);
        var firmwareFile = firmwareFileElement.files[0];
        // Send the update request.
        updateFirmware(fwStorageDir + firmwareFile.name);
    }
}

// Updates the firmware of the device.
function updateFirmware(filePath) {
    // Update status.
    setFirmwareUpdateProgressInfo(0, MESSAGE_SENDING_UPLOAD_REQUEST);
    // Send request to update the firmware.
    $.post(
        "http://" + getServerAddress() + "/ajax/update_firmware",
        JSON.stringify({
            "file": filePath
        }),
        function(data) {
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Process update firmware answer.
            processUpdateFirmwareResponse(data);
        }
    ).fail(function(response) {
        // Flag updating variable.
        updatingFirmware = false;
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        // Process error.
        error = processAjaxErrorResponse(response);
        // Update upload status.
        setFirmwareUpdateProgressError(error);
        // Enable the management page controls.
        enableManagementPageControls(true);
    });
}

// Processes the response of the update firmware request.
function processUpdateFirmwareResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        error = getErrorFromResponse(response);
        // Update upload status.
        setFirmwareUpdateProgressError(error);
        // Flag updating variable.
        updatingFirmware = false;
        // Enable the page controls.
        enableManagementPageControls(true);
    } else {
        // Update progress status.
        setFirmwareUpdateProgressInfo(100, MESSAGE_SENDING_FIRMWARE_UPDATE_REQUEST);
        // Start timer to check firmware update status periodically.
        startFirmwareUpdateTimer();
        // Check first firmware update status in 2 seconds.
        window.setTimeout(function () {
            checkFirmwareUpdateStatus();
        }, 2000);
    }
}

// Starts a timer to check the firmware update status.
function startFirmwareUpdateTimer() {
    // Sanity checks
    if (!isManagementShowing() || firmwareUpdateTimer != null)
        return;
    // Start timer to check firmware update status.
    firmwareUpdateTimer = setInterval(checkFirmwareUpdateStatus, FIRMWARE_UPDATE_CHECK_INTERVAL);
}

// Stops the timer to check the firmware update status.
function stopFirmwareUpdateTimer() {
    // Stop timer.
    if (firmwareUpdateTimer != null && firmwareUpdateTimer != "undefined") {
        clearInterval(firmwareUpdateTimer);
        firmwareUpdateTimer = null;
    }
}

// Checks the firmware update status.
function checkFirmwareUpdateStatus() {
    // Sanity checks
    if (!isManagementShowing()) {
        // Stop timer.
        stopFirmwareUpdateTimer();
        return;
    }
    // Send request to check firmware update status.
    $.post(
        "http://" + getServerAddress() + "/ajax/check_firmware_update_status",
        function(data) {
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Process check firmware update status answer.
            processCheckFirmwareUpdateStatusResponse(data);
        }
    ).fail(function(response) {
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        $.get("http://" + getServerAddress() + "/ping", function() {
            // Process error.
            processAjaxErrorResponse(response);
        }).fail(function() {
            if (!deviceRebooting)
                showRebootInfo();
        });
    });
}

// Processes the response of the check firmware update status request.
function processCheckFirmwareUpdateStatusResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Check if the firmware update is running.
        if (response[ID_STATUS] == VALUE_ACTIVE) {
            // Check the firmware update progress.
            checkFirmwareUpdateProgress();
        } else if (response[ID_STATUS] == VALUE_FAILED || response[ID_STATUS] == VALUE_SUCCESSFUL || response[ID_STATUS] == VALUE_CANCELED) {
            // Stop timer.
            stopFirmwareUpdateTimer();
            // Flag the update variable.
            updatingFirmware = false;
            // Enable page controls.
            enableManagementPageControls(true);
            // Update the firmware update progress.
            if (response[ID_STATUS] == VALUE_FAILED || response[ID_STATUS] == VALUE_CANCELED)
                setFirmwareUpdateProgressError(ERROR_TITLE + ": " + response[ID_MESSAGE]);
            else {
                // Reset read info variable so info is read again after device reboots.
                managementInfoRead = false;
                // Set update as successful.
                setFirmwareUpdateProgressSuccess(response[ID_MESSAGE]);
                showRebootInfo();
            }
        }
    }
}

// Checks if there is a firmware update running.
function checkFirmwareUpdateRunning() {
    // Sanity checks
    if (!isManagementShowing())
        return;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_CHECKING_FIRMWARE_UPDATE_STATUS);
    // Send request to check firmware update running.
    $.post(
        "http://" + getServerAddress() + "/ajax/check_firmware_update_running",
        function(data) {
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Hide the loading popup.
            showLoadingPopup(false);
            // Process check firmware update status answer.
            processCheckFirmwareUpdateRunningResponse(data);
        }
    ).fail(function(response) {
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        // Hide the loading popup.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the check firmware update running request.
function processCheckFirmwareUpdateRunningResponse(response) {
    // Check if the firmware update is running.
    if (response[ID_UPDATE_RUNNING] == true) {
        // Flag the update variable.
        updatingFirmware = true;
        // Disable page controls.
        enableManagementPageControls(false);
        // Show firmware update progress.
        showFirmwareUpdateProgress(true);
        // Update the firmware update progress.
        setFirmwareUpdateProgressInfo(0, "");
        // Check the firmware update progress.
        checkFirmwareUpdateProgress();
        // Subscribe timer.
        startFirmwareUpdateTimer();
    }
}

// Checks the firmware update progress.
function checkFirmwareUpdateProgress() {
    // Sanity checks
    if (!isManagementShowing())
        return;
    // Hide the info popup.
    showInfoPopup(false);
    // Hide the loading popup.
    showLoadingPopup(false);
    // Send request to check firmware update progress.
    $.post(
        "http://" + getServerAddress() + "/ajax/check_firmware_update_progress",
        function(data) {
            // Process only in the management page.
            if (!isManagementShowing())
                return;
            // Process check firmware update progress answer.
            processCheckFirmwareUpdateProgressResponse(data);
        }
    ).fail(function(response) {
        // Process only in the management page.
        if (!isManagementShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the firmware update progress.
function processCheckFirmwareUpdateProgressResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Update the firmware update progress.
        setFirmwareUpdateProgressInfo(response[ID_PROGRESS], response[ID_MESSAGE]);
    }
}

// Enables/disables the management page controls.
function enableManagementPageControls(enable) {
    // Reboot button.
    enableManagementButton(ID_REBOOT_BUTTON, enable);
    // Update firmware button.
    var activeTab = getActiveFirmwareUpdateTab();
    if (activeTab == ID_FIRMWARE_TAB_UPLOAD) {
        var firmwareFileElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE);
        if (firmwareFileElement.files.length == 0)
            enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, false);
        else
            enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, enable);
    }
    // Tabs.
    var tabUploadElement = document.getElementById(ID_FIRMWARE_TAB_UPLOAD);
    var tabUploadHeaderElement = document.getElementById(ID_FIRMWARE_TAB_UPLOAD_HEADER);
    if (enable) {
        tabUploadElement.classList.remove((CLASS_DISABLED_DIV));
        tabUploadHeaderElement.classList.remove((CLASS_DISABLED_DIV));
    } else {
        tabUploadElement.classList.add((CLASS_DISABLED_DIV));
        tabUploadHeaderElement.classList.add((CLASS_DISABLED_DIV));
    }
}

// Enables/disables the given button ID
function enableManagementButton(buttonID, enable) {
    // Initialize variables.
    var buttonElement = document.getElementById(buttonID);
    if (buttonElement != null) {
        if (enable) {
            if (buttonElement.classList.contains(CLASS_CONFIG_BUTTON_DISABLED))
                buttonElement.classList.remove(CLASS_CONFIG_BUTTON_DISABLED);
        } else {
            if (!buttonElement.classList.contains(CLASS_CONFIG_BUTTON_DISABLED))
                buttonElement.classList.add(CLASS_CONFIG_BUTTON_DISABLED);
        }
    }
}

// Returns the active firmware update tab.
function getActiveFirmwareUpdateTab() {
    // Initialize variables.
    var tabUploadHeaderElement = document.getElementById(ID_FIRMWARE_TAB_UPLOAD_HEADER);
    // Check the active tab.
    if (tabUploadHeaderElement.classList.contains(CLASS_FIRMWARE_TAB_HEADER_ACTIVE))
        return ID_FIRMWARE_TAB_UPLOAD;
    else
        return null;
}

// Returns whether the device is rebooting or not.
function isDeviceRebooting() {
    return deviceRebooting;
}

// Returns whether firmware update is running or not.
function isFirmwareUpdateRunning() {
    return updatingFirmware;
}

// Shows the given firmware tab
function showFirmwareTab(tabID) {
    // Initialize variables.
    var tabElement = document.getElementById(tabID);
    var tabHeaderElement = document.getElementById(tabID + "_header");
    if (tabElement != null && tabHeaderElement != null) {
        // Deselect all tab headers.
        var tabHeaders = document.getElementsByClassName(CLASS_FIRMWARE_TAB_HEADER);
        for (var i = 0; i < tabHeaders.length; i++) {
            var tabHeader = tabHeaders[i];
            if (tabHeader.classList.contains(CLASS_FIRMWARE_TAB_HEADER_ACTIVE))
                tabHeader.classList.remove(CLASS_FIRMWARE_TAB_HEADER_ACTIVE);
        }
        // Hide all the tabs.
        var tabs = document.getElementsByClassName(CLASS_FIRMWARE_TAB);
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            tab.style.display = "none";
        }
        // Show the selected tab.
        tabHeaderElement.classList.add(CLASS_FIRMWARE_TAB_HEADER_ACTIVE);
        tabElement.style.display = "block";
        // Disable firmware update button.
        enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, false);
        // Hide firmware update progress.
        showFirmwareUpdateProgress(false);
        // Perform additional actions on each tab.
        switch(tabID) {
            case ID_FIRMWARE_TAB_UPLOAD:
                // Check if there is a file in the file input.
                var firmwareFileElement = document.getElementById(ID_UPDATE_FIRMWARE_FILE);
                if (firmwareFileElement.files.length > 0) {
                    // Enable firmware update button.
                    enableManagementButton(ID_UPDATE_FIRMWARE_BUTTON, true);
                }
                break;
        }
    }
}

// Shows/hides the firmware update progress section.
function showFirmwareUpdateProgress(visible) {
    // Initialize variables.
    var firmwareUpdateProgressElement = document.getElementById(ID_UPDATE_FIRMWARE_PROGRESS);
    if (firmwareUpdateProgressElement != null) {
        if (visible)
            firmwareUpdateProgressElement.style.display = "block";
        else
            firmwareUpdateProgressElement.style.display = "none";
    }
}

// Sets the firmware update progress.
function setFirmwareUpdateProgressInfo(progress, message=null) {
    updateFirmwareUpdateProgress(UPDATE_INFO, progress, TITLE_FIRMWARE_UPDATE_IN_PROGRESS, message);
}

// Sets the firmware update progress error.
function setFirmwareUpdateProgressError(message=null) {
    updateFirmwareUpdateProgress(UPDATE_ERROR, 100, TITLE_FIRMWARE_UPDATE_ERROR, message);
}

// Sets the firmware update progress success.
function setFirmwareUpdateProgressSuccess(message=null) {
    updateFirmwareUpdateProgress(UPDATE_SUCCESS, 100, TITLE_FIRMWARE_UPDATE_SUCCESS, message);
}

// Updates the firmware update progress.
function updateFirmwareUpdateProgress(status, progress, title=null, message=null) {
    // Initialize variables.
    var firmwareUpdateProgressElement = document.getElementById(ID_UPDATE_FIRMWARE_PROGRESS);
    if (firmwareUpdateProgressElement != null) {
        // Update the progress bar.
        var progressBarElement = document.getElementById(ID_UPDATE_FIRMWARE_PROGRESS_BAR);
        if (progressBarElement != null) {
            // Update the progress bar status type.
            if (progressBarElement.classList.contains(CLASS_PROGRESS_BAR_INFO))
                progressBarElement.classList.remove(CLASS_PROGRESS_BAR_INFO);
            if (progressBarElement.classList.contains(CLASS_PROGRESS_BAR_ERROR))
                progressBarElement.classList.remove(CLASS_PROGRESS_BAR_ERROR);
            if (progressBarElement.classList.contains(CLASS_PROGRESS_BAR_SUCCESS))
                progressBarElement.classList.remove(CLASS_PROGRESS_BAR_SUCCESS);
            switch (status) {
                case UPDATE_INFO:
                    progressBarElement.classList.add(CLASS_PROGRESS_BAR_INFO);
                    break;
                case UPDATE_ERROR:
                    progressBarElement.classList.add(CLASS_PROGRESS_BAR_ERROR);
                    break;
                case UPDATE_SUCCESS:
                    progressBarElement.classList.add(CLASS_PROGRESS_BAR_SUCCESS);
                    break;
            }
            // Update the progress bar percent.
            if (progress != "?") {
                progressBarElement.style.width = progress + "%";
                progressBarElement.innerHTML = progress + "%";
            } else {
                let html = progressBarElement.innerHTML;
                if (html.startsWith("."))
                    progressBarElement.innerHTML = html + ".";
                else
                    progressBarElement.innerHTML = ".";
            }
        }
        // Update the progress title.
        var progressTitleElement = document.getElementById(ID_UPDATE_FIRMWARE_PROGRESS_TITLE);
        if (progressTitleElement != null) {
            if (title != null)
                progressTitleElement.innerHTML = title;
            else
                progressTitleElement.innerHTML = "";
        }
        // Update the progress message.
        var progressMessageElement = document.getElementById(ID_UPDATE_FIRMWARE_PROGRESS_MESSAGE);
        if (progressMessageElement != null) {
            if (message != null)
                progressMessageElement.innerHTML = message;
            else
                progressMessageElement.innerHTML = "";
        }
    }
}
