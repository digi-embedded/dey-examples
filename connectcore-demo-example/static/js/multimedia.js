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

// Variables.
var readingMultimediaInfo = false;
var multimediaInfoRead = false;

// Initializes the multimedia page.
function initializeMultimediaPage() {
    // Sanity checks.
    if (!isMultimediaShowing() || multimediaInfoRead)
        return;
    // Read multimedia information.
    readDeviceInfoMultimedia();
}

// Gets the information of the device.
function readDeviceInfoMultimedia() {
    // Execute only in the multimedia page.
    if (!isMultimediaShowing() || readingMultimediaInfo)
        return;
    // Flag reading variable.
    readingMultimediaInfo = true;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_LOADING_INFORMATION);
    // Send request to retrieve device information.
    $.post(
        "http://" + getServerAddress() + "/ajax/get_device_info",
        function(data) {
            readingMultimediaInfo = false;
            // Process only in the management page.
            if (!isMultimediaShowing())
                return;
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process device information answer.
            processDeviceInfoMultimediaResponse(data);
        }
    ).fail(function(response) {
        // Flag reading variable.
        readingMultimediaInfo = false;
        // Process only in the management page.
        if (!isMultimediaShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the device info request.
function processDeviceInfoMultimediaResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // Set the device type.
         updateFieldValue(ID_DEVICE_NAME, response[ID_DEVICE_TYPE].toUpperCase()); 
        // Flag device info read.
        multimediatInfoRead = true;
    }
}

