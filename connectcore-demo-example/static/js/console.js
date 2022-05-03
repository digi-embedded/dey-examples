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
const CONSOLE_CURSOR_BLINK = true;
const CONSOLE_NUM_ROWS = 30;
const CONSOLE_SCROLLBACK = 1000;
const CONSOLE_TAB_STOP_WIDTH = 8;
const CONSOLE_MAX_SEND_COMMANDS = 5;
const CONSOLE_SEND_COMMANDS_DELAY = 150;

const ID_CONSOLE_CLOSE_BUTTON = "console_close_button";
const ID_CONSOLE_CONTAINER = "console_container";
const ID_CONSOLE_ERROR_RECONNECT = "console_error_reconnect";
const ID_CONSOLE_ERROR_TEXT = "console_error_text";
const ID_CONSOLE_HEADER = "console_header";
const ID_CONSOLE_HOVER_BACKGROUND = "console_hover_background";
const ID_CONSOLE_LOADING = "console_loading";
const ID_CONSOLE_PANEL = "console_panel";
const ID_CONSOLE_RECONNECT_BUTTON = "console_reconnect_button";
const ID_CONSOLE_VIEWPORT = "xterm-viewport";

const CLI_MESSAGE_TYPE_DATA = "data";
const CLI_MESSAGE_TYPE_ERROR = "error";
const CLI_MESSAGE_TYPE_START = "start";
const CLI_MESSAGE_TYPE_TERMINATE = "terminate";

const ERROR_SESSION_CLOSED_REMOTELY = "Session closed from the remote end";
const ERROR_SESSION_CLOSING = "Previous console session is closing, please wait a moment...";

// Variables.
var term;
var cliSessionID;
var cliSocket;
var cliSessionTerminating = false;
var fitAddon;
var commandsToSend = [];
var cliTerminateFlagTimer = null;
var consoleResizeObserver = null;

// Opens the console.
function openConsole() {
    // Check if console is showing.
    if (isConsoleShowing())
        return;
    // Check if previous session is terminating.
    if (cliSessionTerminating) {
        toastr.info(ERROR_SESSION_CLOSING);
        return;
    }
    // Initialize variables.
    var consoleDiv = document.getElementById(ID_CONSOLE);
    // Remove any residual terminals.
    while (consoleDiv.firstChild)
        consoleDiv.removeChild(consoleDiv.lastChild);
    // Create the terminal instance.
    term = new Terminal({
        cursorBlink: CONSOLE_CURSOR_BLINK,
        scrollback: CONSOLE_SCROLLBACK,
        tabStopWidth: CONSOLE_TAB_STOP_WIDTH,
        rows: CONSOLE_NUM_ROWS
    });
    // Configure terminal input data event.
    term.onData( (data) => {
        sendCLIData(data);
    });
    // Load Fit addon.
    fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    // Attach the terminal to the div.
    term.open(consoleDiv);
    // Setup resize observer.
    if (consoleResizeObserver == null || consoleResizeObserver == "undefined") {
        consoleResizeObserver = new ResizeObserver((entries) => {
            adjustConsoleSize();
        })
        consoleResizeObserver.observe(document.getElementById(ID_CONSOLE_CONTAINER));
    }
    // Show the console.
    var consolePanel = document.getElementById(ID_CONSOLE_PANEL);
    consolePanel.style.visibility = "visible";
    consolePanel.style.display = "flex";
    // Adjust console size after some time to give time to the terminal to load.
    window.setTimeout(function () {
       adjustConsoleSize();
    }, 100);
    adjustConsoleSize();
    // Initialize the CLI session.
    initCLISession();
}

// Adjusts the console size.
function adjustConsoleSize() {
    // Sanity checks.
    if (!isConsoleShowing())
        return;
    // Initialize variables.
    var consoleContainer = document.getElementById(ID_CONSOLE_CONTAINER);
    var consoleViewPort = document.getElementsByClassName(ID_CONSOLE_VIEWPORT)[0];
    var consoleHeader = document.getElementById(ID_CONSOLE_HEADER);
    var consoleHoverBackground = document.getElementById(ID_CONSOLE_HOVER_BACKGROUND);
    // Adjust terminal size.
    if (fitAddon != null && fitAddon != "undefined")
        fitAddon.fit();
    // Obtain dimensions.
    var consoleHeight = consoleViewPort.clientHeight;
    var headerHeight = consoleHeader.clientHeight;
    // Set size values.
    consoleContainer.style.height = (consoleHeight + headerHeight).toString() + "px";
    consoleHoverBackground.style.height = (consoleContainer.clientHeight - headerHeight).toString() + "px";
    consoleViewPort.style.width = "initial";
}

// Returns whether the console window is open or not.
function isConsoleShowing() {
    // Sanity checks.
    if (!isDashboardShowing())
        return false;
    // Initialize variables.
    var consolePanel = document.getElementById(ID_CONSOLE_PANEL);
    // Return whether the console is showing or not.
    return consolePanel.style.visibility == "visible";
}

// Shows/hides the console loading panel.
function showConsoleLoading(visible) {
    // Initialize variables.
    var consoleHoverBackground = document.getElementById(ID_CONSOLE_HOVER_BACKGROUND);
    var consoleLoading = document.getElementById(ID_CONSOLE_LOADING);
    // Show/hide the loading panel.
    if (visible && isConsoleShowing()) {
        consoleHoverBackground.style.visibility = "visible";
        consoleLoading.style.visibility = "visible";
    } else {
        consoleHoverBackground.style.visibility = "hidden";
        consoleLoading.style.visibility = "hidden";
    }
}

// Shows/hides the console error with reconnect panel.
function showConsoleErrorReconnect(visible, error) {
    // Initialize variables.
    var consoleHoverBackground = document.getElementById(ID_CONSOLE_HOVER_BACKGROUND);
    var consoleErrorReconnect = document.getElementById(ID_CONSOLE_ERROR_RECONNECT);
    var consoleErrorText = document.getElementById(ID_CONSOLE_ERROR_TEXT);
    var reconnectButton = document.getElementById(ID_CONSOLE_RECONNECT_BUTTON);
    var closeButton = document.getElementById(ID_CONSOLE_CLOSE_BUTTON);
    // Show/hide the error panel.
    if (visible && isConsoleShowing()) {
        consoleHoverBackground.style.visibility = "visible";
        consoleErrorReconnect.style.visibility = "visible";
        reconnectButton.style.visibility = "visible";
        closeButton.style.visibility = "visible";
        if (error == null)
            error = ERROR_UNKNOWN_ERROR;
        consoleErrorText.innerText = error;
    } else {
        consoleHoverBackground.style.visibility = "hidden";
        consoleErrorReconnect.style.visibility = "hidden";
        reconnectButton.style.visibility = "hidden";
        closeButton.style.visibility = "hidden";
    }
}

// Initializes a CLI session.
function initCLISession() {
    // Hide error with reconnect panel.
    showConsoleErrorReconnect(false);
    // Clear the terminal.
    term.clear();
    // Show loading panel.
    showConsoleLoading(true);
    $.post(
        "../ajax/cli_init_session",
        function(data) {
            // Process only if the console is showing.
            if (!isConsoleShowing())
                return;
            // Process answer.
            processInitCLISessionResponse(data);
        }
    ).fail(function(response) {
        // Process only if the console is showing.
        if (!isConsoleShowing())
            return;
        // Process error.
        var error = processAjaxErrorResponse(response);
        // Hide the loading status.
        showConsoleLoading(false);
        // Show error with reconnect panel.
        showConsoleErrorReconnect(true, error);
    });
}

// Processes the init CLI session response.
function processInitCLISessionResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showConsoleLoading(false);
        // Show error with reconnect panel.
        showConsoleErrorReconnect(true, error);
    } else {
        // Store session ID.
        cliSessionID = response[ID_SESSION_ID];
        // Register the TCP monitor.
        subscribeCLISession(cliSessionID);
    }
}

// Sends the given CLI data.
function sendCLIData(data) {
    // Check if CLI session exists.
    if (cliSessionID == null)
        return;
    // Add the command to the buffer.
    commandsToSend.push(data);
    // If the send timer is scheduled and there is enough data to send,
    // return to let the timer to complete.
    if (sendTimerScheduled && commandsToSend.length > CONSOLE_MAX_SEND_COMMANDS)
        return;
    if (sendTimer != null && sendTimer != "undefined") {
        clearTimeout(sendTimer);
        sendTimer = null;
    }
    // Schedule the timer.
    sendTimer = setTimeout(function() {
        // Clear timer flag.
        sendTimerScheduled = false;
        // Build data.
        var dataToSend = btoa(commandsToSend.join(""));
        commandsToSend = [];
        $.post(
            "../ajax/cli_data",
            JSON.stringify({
                "session_id": cliSessionID,
                "data": dataToSend
            }),
            function(data) {
                // Process only if the console is showing.
                if (!isConsoleShowing())
                    return;
                // Process answer.
                processCLISendDataResponse(data);
            }
        ).fail(function(response) {
            // Process only if the console is showing.
            if (!isConsoleShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
        });
    }, CONSOLE_SEND_COMMANDS_DELAY);
    // Set timer flag.
    sendTimerScheduled = true;
}

// Processes the send CLI data response.
function processCLISendDataResponse(response) {
    // Check if there was any error in the request.
    checkErrorResponse(response, false);
}

// Closes the console.
function closeConsole() {
    // Check if console is showing.
    if (!isConsoleShowing())
        return;
    // Hide the loading panel.
    showConsoleLoading(false);
    // Hide the error reconnect panel.
    showConsoleErrorReconnect(false);
    // Terminate the CLI session.
    terminateCLIsession();
    // Hide the console.
    var consolePanel = document.getElementById(ID_CONSOLE_PANEL);
    consolePanel.style.visibility = "collapse";
    consolePanel.style.display = "none";
}

// Terminates the CLI session.
function terminateCLIsession() {
    // Check if CLI session exists.
    if (cliSessionID == null)
        return;
    // Flag session terminating.
    cliSessionTerminating = true;
    cliTerminateFlagTimer = window.setTimeout(function () {
       cliSessionTerminating = false;
    }, 30000); // In the case the terminate request hangs, set a timeout to manually remove the flag.
    // Send request to terminate CLI session.
    $.post(
        "../ajax/cli_terminate_session",
        JSON.stringify({
            "session_id": cliSessionID
        }),
        function(data) {
            // Process only if the console is showing.
            if (!isConsoleShowing())
                return;
            // Process answer.
            processTerminateCLISessionResponse(data);
        }
    ).fail(function(response) {
        // Un-flag session terminating.
        cliSessionTerminating = false;
        window.clearTimeout(cliTerminateFlagTimer);
        // Process only if the console is showing.
        if (!isConsoleShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
    });
    // Clear CLI session ID.
    cliSessionID = null;
}

// Processes the terminate CLI session response.
function processTerminateCLISessionResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Un-flag session terminating.
        cliSessionTerminating = false;
        window.clearTimeout(cliTerminateFlagTimer);
    }
}

// Subscribes to any CLI session change.
function subscribeCLISession(sessionID) {
    // Create the web socket.
    //var socketPrefix = window.location.protocol == "https:" ? "wss" : "ws";
    //cliSocket = new WebSocket(socketPrefix + "://" + window.location.host + "/ws/cli/" + device.getDeviceID() + "/" + sessionID);
    // Define the callback to be notified when data is received in the web socket.
    cliSocket.onmessage = function(e) {
        if (isDashboardShowing() && term != null && term != "undefined") {
            var event = JSON.parse(e.data);
            var type = event[ID_TYPE];
            switch (type) {
                case CLI_MESSAGE_TYPE_DATA:
                    var data = event[ID_DATA];
                    var decodedData = atob(data);
                    if (isConsoleShowing())
                        term.write(decodedData);
                    break;
                case CLI_MESSAGE_TYPE_TERMINATE:
                case CLI_MESSAGE_TYPE_ERROR:
                    cliSessionID = null;
                    if (cliSocket != null && cliSocket != "undefined")
                        cliSocket.close();
                    // Hide the loading status.
                    showConsoleLoading(false);
                    // Check specific type.
                    var error = null;
                    if (type == CLI_MESSAGE_TYPE_TERMINATE && isConsoleShowing())
                        error = ERROR_SESSION_CLOSED_REMOTELY;
                    else if (type == CLI_MESSAGE_TYPE_ERROR)
                        error = event[ID_ERROR];
                    if (isConsoleShowing())
                        showConsoleErrorReconnect(true, error);
                    if (error != null && (type == CLI_MESSAGE_TYPE_ERROR ||
                            (type == CLI_MESSAGE_TYPE_TERMINATE && isConsoleShowing())))
                        toastr.error(error);
                    // Un-flag session terminating.
                    cliSessionTerminating = false;
                    window.clearTimeout(cliTerminateFlagTimer);
                    break;
                case CLI_MESSAGE_TYPE_START:
                    // Hide the loading status.
                    showConsoleLoading(false);
                    break;
            }
        }
    };
}
