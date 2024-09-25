/*
 * Copyright (C) 2024, Digi International Inc.
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
const ID_NPU_DEMOS = "npu_demos";
const ID_NPU_IMAGE = "preview_image";
const ID_NPU_DEMOS_CONTAINER = "npu_demos_container";

const CLASS_4_COLUMNS_XL = "col-xl-3"
const CLASS_NPU_DEMO_CONTAINER = "npu-container"

const TEMPLATE_NPU_DEMO = "" +
    "<div class='d-flex justify-content-center align-items-center npu-box'>" +
    "    <div class='npu-item' onclick='runNPUDemo(\"{0}\")'>" +
    "        <div class='npu-title'>{1}</div>" +
    "        <img src='./static/images/{2}' alt='{3}'>" +
    "    </div>" +
    "</div>";
const TEMPLATE_NO_DEMOS = "<p style='padding-left: 15px;'><i>No demos found</i></p>";

const MESSAGE_EXECUTING_NPU_DEMO = "Executing NPU demo...";

const CHECK_DEMO_RUNNING_OFFSET = 8000;
const CHECK_DEMO_RUNNING_TIME = 200;

// Variables.
var readingNPUInfo = false;
var npuInfoRead = false;

// Initializes the npu page.
function initializeNPUPage() {
    // Sanity checks.
    if (!isNPUShowing() || npuInfoRead)
        return;
    // Read NPU demos information.
    readNPUDemos();
}

// Read the NPU demos information.
function readNPUDemos() {
    // Execute only in the NPU page.
    if (!isNPUShowing() || npuInfoRead)
        return;
    // Flag reading variable.
    readingNPUInfo = true;
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_LOADING_INFORMATION);
    // Send request to read NPU demos information.
    $.post(
        "http://" + getServerAddress() + "/ajax/get_npu_demos",
        function(data) {
            readingNPUInfo = false;
            // Process only in the NPU page.
            if (!isNPUShowing())
                return;
            // Hide the loading panel.
            showLoadingPopup(false);
            // Process the answer.
            processNPUDemosResponse(data);
        }
    ).fail(function(response) {
        // Flag reading variable.
        readingNPUInfo = false;
        // Process only in the NPU page.
        if (!isNPUShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the NPU demos request.
function processNPUDemosResponse(response) {
    // Check if there was any error in the request.
    if (!checkErrorResponse(response, false)) {
        // List the available demos.
        listNPUDemos(JSON.parse(response[ID_DATA]));
        // Flag device info read.
        npuInfoRead = true;
    }
}

// Lists and draws the given NPU demos.
function listNPUDemos(npuDemos) {
    var npuDemosContainer = document.getElementById(ID_NPU_DEMOS_CONTAINER);

    // Process response entries and create HTML elements.
    if (npuDemos.length === 0) {
        var entryDiv = document.createElement("div");

        entryDiv.innerHTML = TEMPLATE_NO_DEMOS;
        npuDemosContainer.appendChild(entryDiv);
    } else {
        for (var demo of npuDemos) {
            var id = demo[ID_ID];
            var name = demo[ID_NAME];
            var image = demo[ID_NPU_IMAGE];
            var entryDiv = document.createElement("div");

            entryDiv.classList.add(CLASS_4_COLUMNS_XL);
            entryDiv.classList.add(CLASS_NPU_DEMO_CONTAINER);
            entryDiv.innerHTML = TEMPLATE_NPU_DEMO.format(id, name, image, name);
            npuDemosContainer.appendChild(entryDiv);
        }
    }
}

// Runs the given NPU demo.
function runNPUDemo(npuDemoID) {
    // Hide the info popup.
    showInfoPopup(false);
    // Show the loading popup.
    showLoadingPopup(true, MESSAGE_EXECUTING_NPU_DEMO);
    // Send request.
    $.post(
        "http://" + getServerAddress() + "/ajax/run_npu_demo",
        JSON.stringify({
            "demo_id": npuDemoID,
        }),
        function(data) {
            // Process only in the NPU page.
            if (!isNPUShowing())
                return;
            // Process answer.
            processRunNPUDemoResponse(data);
        }
    ).fail(function(response) {
        // Process only in the NPU page.
        if (!isNPUShowing())
            return;
        // Hide the loading panel.
        showLoadingPopup(false);
        // Process error.
        processAjaxErrorResponse(response);
    });
}

// Processes the response of the run NPU demo request.
function processRunNPUDemoResponse(response) {
    // Check if there was any error in the request.
    checkErrorResponse(response, false);
    demoID = response[ID_ID];
    // Start timer to check whether demo is running.
    blackFrame = document.getElementById('black_frame');
    blackFrame.style.pointerEvents = 'auto';
    blackFrame.style.opacity = 1;
    setTimeout(() => {
        // Process only in the NPU page.
        if (!isNPUShowing())
            return;
        // Show top black bar.
        isNPUDemoRunning(demoID);
    }, CHECK_DEMO_RUNNING_OFFSET);
}

// Checks whether the given NPU demo is running or not.
function isNPUDemoRunning(npuDemoID) {
    // Send request.
    $.post(
        "http://" + getServerAddress() + "/ajax/is_npu_demo_running",
        JSON.stringify({
            "demo_id": npuDemoID,
        }),
        function(data) {
            // Process only in the NPU page.
            if (!isNPUShowing())
                return;
            // Process answer.
            processIsNPUDemoRunningResponse(data);
        }
    ).fail(function(response) {
        // Process only in the NPU page.
        if (!isNPUShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the black frame.
        blackFrame = document.getElementById('black_frame');
        blackFrame.style.opacity = 0;
        blackFrame.style.pointerEvents = 'none';
        // Hide the loading panel.
        showLoadingPopup(false);
    });
}

// Processes the response of the is NPU demo running request.
function processIsNPUDemoRunningResponse(response) {
    // Check if there was any error in the request.
    checkErrorResponse(response, false);
    // Check whether demo is running.
    demoID = response[ID_ID];
    isRunning = response[ID_IS_RUNNING];
    if (isRunning) {
        // Schedule to check again.
        setTimeout(() => {
            // Process only in the NPU page.
            if (!isNPUShowing())
                return;
            isNPUDemoRunning(demoID);
        }, CHECK_DEMO_RUNNING_TIME);
    } else { // Demo is not running.
        // Hide the black frame.
        blackFrame = document.getElementById('black_frame');
        blackFrame.style.opacity = 0;
        blackFrame.style.pointerEvents = 'none';
        // Hide the loading panel.
        showLoadingPopup(false);
    }
}