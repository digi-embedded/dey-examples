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
const ID_CURRENT_DIRECTORY = "current_directory";
const ID_FILE_SYSTEM_CONTAINER = "filesystem_container";
const ID_FILE_SYSTEM_DIR_NAME = "filesystem_directory_name";
const ID_FILE_SYSTEM_DIR_NAME_BUTTON = "filesystem_directory_name_button";
const ID_FILE_SYSTEM_DIR_NAME_ERROR = "filesystem_directory_name_error";
const ID_FILE_SYSTEM_DIR_NAME_PANEL = "filesystem_dir_name_panel";
const ID_FILE_SYSTEM_DOWNLOAD_FILE_BUTTON = "filesystem_download_file_button";
const ID_FILE_SYSTEM_HEADER = "filesystem_header";
const ID_FILE_SYSTEM_HOVER_BACKGROUND = "filesystem_hover_background";
const ID_FILE_SYSTEM_ITEMS_CONTAINER = "filesystem_items_container";
const ID_FILE_SYSTEM_ITEMS_HEADER = "filesystem_items_header";
const ID_FILE_SYSTEM_LOADING = "filesystem_loading";
const ID_FILE_SYSTEM_PANEL = "filesystem_panel";
const ID_FILE_SYSTEM_REMOVE_FILE_BUTTON = "filesystem_remove_file_button";
const ID_FILE_SYSTEM_TOOLBAR = "filesystem_toolbar";
const ID_FILE_TO_UPLOAD = "file_to_upload";

const CLASS_FA_FILE = "fa-file";
const CLASS_FILE_SYSTEM_BUTTON_DISABLED = "filesystem-button-disabled";
const CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED = "filesystem-dir-name-button-disabled";
const CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR = "filesystem-dir-name-input-error";
const CLASS_FILE_SYSTEM_ENTRY_SELECTED = "filesystem-entry-selected";

const FS_TYPE_FILE = "file";
const FS_TYPE_DIRECTORY = "dir";

const TITLE_CONFIRM_REMOVE = "Confirm Remove";

const MESSAGE_CONFIRM_REMOVE = "Are you sure you want to remove the selected file?";

const PREFIX_FS = "fs_";

const REGEX_DIRECTORY_NAME = '^[^\\s^\x00-\x1f\\?*:"";<>|\\/.][^\x00-\x1f\\?*:"";<>|\\/]*[^\\s^\x00-\x1f\\?*:"";<>|\\/.]+$';

const TEMPLATE_DIRECTORY = "" +
    "<div id='fs_{0}' class='filesystem-entry' title='{1}' onclick='listDirectory(\"{2}\")'>" +
    "    <div class='fas fa-folder fa-lg filesystem-entry-icon'></div>" +
    "    <div class='filesystem-entry-name'>{3}</div>" +
    "    <div class='filesystem-entry-size'></div>" +
    "    <div class='filesystem-entry-last-modified'>{4}</div>" +
    "</div>";
const TEMPLATE_FILE = "" +
    "<div id='fs_{0}' class='filesystem-entry' title='{1}' onclick='selectFileSystemEntry(\"fs_{2}\")' ondblclick='downloadFile(\"{3}\")'>" +
    "    <div class='fas fa-file fa-lg filesystem-entry-icon'></div>" +
    "    <div class='filesystem-entry-name'>{4}</div>" +
    "    <div class='filesystem-entry-size'>{5}</div>" +
    "    <div class='filesystem-entry-last-modified'>{6}</div>" +
    "</div>";

const ERROR_DIR_NAME_EMPTY = "Directory name cannot be empty.";
const ERROR_DIR_NAME_INVALID = "The entered name is not valid.";

const ROOT_DIRECTORY = "/";

// Variables.
var currentDirectory = null;
var selectedFileSystemEntry = null;
var filesystemResizeObserver = null;

// Opens the file system panel.
function openFileSystem() {
    // Check if the file system is showing.
    if (isFileSystemShowing())
        return;
    // Reset current directory.
    currentDirectory = null;
    $("#" + ID_CURRENT_DIRECTORY).text("");
    // Unselect all entries.
    unselectFileSystemEntries();
    // Clear all the file system entries.
    clearFileSystemEntries();
    // Setup resize observer.
    if (filesystemResizeObserver == null || filesystemResizeObserver == "undefined") {
        filesystemResizeObserver = new ResizeObserver((entries) => {
            resizeFileSystemElements();
        })
        filesystemResizeObserver.observe(document.getElementById(ID_FILE_SYSTEM_CONTAINER));
    }
    // Resize filesystem elements.
    resizeFileSystemElements();
    // Show the file system.
    var fileSystemContainer = document.getElementById(ID_FILE_SYSTEM_PANEL);
    fileSystemContainer.style.visibility = "visible";
    // List root directory.
    listDirectory(ROOT_DIRECTORY);
}

// Returns whether the file system window is open or not.
function isFileSystemShowing() {
    // Sanity checks.
    if (!isDashboardShowing())
        return false;
    // Initialize variables.
    var fileSystemContainer = document.getElementById(ID_FILE_SYSTEM_PANEL);
    // Return visibility.
    return fileSystemContainer.style.visibility == "visible";
}

// Closes the file system panel.
function closeFileSystem() {
    // Check if the file system is showing.
    if (!isFileSystemShowing())
        return;
    // Hide the loading panel.
    showFileSystemLoading(false);
    // Hide the file system panel.
    var fileSystemContainer = document.getElementById(ID_FILE_SYSTEM_PANEL);
    fileSystemContainer.style.visibility = "collapse";
}

// Resizes the file system elements.
function resizeFileSystemElements() {
    // If file system is not showing just return.
    if (!isFileSystemShowing())
        return;
    // Initialize variables.
    var filesystemContainer = document.getElementById(ID_FILE_SYSTEM_CONTAINER);
    var filesystemHeader = document.getElementById(ID_FILE_SYSTEM_HEADER);
    var filesystemToolbar = document.getElementById(ID_FILE_SYSTEM_TOOLBAR);
    var filesystemHoverBackground = document.getElementById(ID_FILE_SYSTEM_HOVER_BACKGROUND);
    var filesystemItemsHeader = document.getElementById(ID_FILE_SYSTEM_ITEMS_HEADER);
    var filesystemItemsContainer = document.getElementById(ID_FILE_SYSTEM_ITEMS_CONTAINER);
    var containerHeight = filesystemContainer.clientHeight;
    var headerHeight = filesystemHeader.clientHeight;
    var toolbarHeight = filesystemToolbar.clientHeight;
    var itemsHeaderHeight = filesystemItemsHeader.clientHeight;
    // Set correct heights.
    filesystemHoverBackground.style.height = (containerHeight - headerHeight).toString() + "px";
    filesystemItemsContainer.style.height = (containerHeight - headerHeight - toolbarHeight - itemsHeaderHeight).toString() + "px";
}

// Shows/hides the file system loading panel.
function showFileSystemLoading(visible) {
    // Initialize variables.
    var fileSystemHoverBackground = document.getElementById(ID_FILE_SYSTEM_HOVER_BACKGROUND);
    var fileSystemLoading = document.getElementById(ID_FILE_SYSTEM_LOADING);
    // Apply visibility.
    if (visible && isFileSystemShowing()) {
        fileSystemHoverBackground.style.visibility = "visible";
        fileSystemLoading.style.visibility = "visible";
    } else {
        fileSystemHoverBackground.style.visibility = "hidden";
        fileSystemLoading.style.visibility = "hidden";
    }
}

// Clears all the file system entries.
function clearFileSystemEntries() {
    // Initialize variables.
    var fileSystemEntriesDiv = document.getElementById(ID_FILE_SYSTEM_ITEMS_CONTAINER);
    // Clear all file system HTML entries.
    while (fileSystemEntriesDiv.firstChild)
        fileSystemEntriesDiv.removeChild(fileSystemEntriesDiv.lastChild);
}

// Enables/disabled the file system buttons.
function enableFileSystemButtons(enable) {
    // Initialize variables.
    var downloadButton = document.getElementById(ID_FILE_SYSTEM_DOWNLOAD_FILE_BUTTON);
    var removeButton = document.getElementById(ID_FILE_SYSTEM_REMOVE_FILE_BUTTON);
    // Apply enable state.
    if (!enable) {
        downloadButton.disabled = true;
        removeButton.disabled = true;
        downloadButton.classList.add(CLASS_FILE_SYSTEM_BUTTON_DISABLED)
        removeButton.classList.add(CLASS_FILE_SYSTEM_BUTTON_DISABLED)
    } else {
        downloadButton.disabled = false;
        removeButton.disabled = false;
        downloadButton.classList.remove(CLASS_FILE_SYSTEM_BUTTON_DISABLED)
        removeButton.classList.remove(CLASS_FILE_SYSTEM_BUTTON_DISABLED)
    }
}

// Selects the given file system entry.
function selectFileSystemEntry(entryID) {
    // Unselect all entries.
    unselectFileSystemEntries();
    // Set selected style to the selected device div.
    var entryElement = document.getElementById(entryID)
    if (entryElement != null)
        entryElement.classList.add(CLASS_FILE_SYSTEM_ENTRY_SELECTED);
    // Save selected entry.
    selectedFileSystemEntry = entryID;
    // Enable buttons.
    enableFileSystemButtons(true);
}

// Unselects all the file system entries.
function unselectFileSystemEntries() {
    // Initialize variables.
    var fileSystemEntriesDiv = document.getElementById(ID_FILE_SYSTEM_ITEMS_CONTAINER);
    var children = fileSystemEntriesDiv.children;
    // Remove selected class from all entries.
    for (var i = 0; i < children.length; i++) {
        var entry = children[i].children[0];
        entry.classList.remove(CLASS_FILE_SYSTEM_ENTRY_SELECTED);
    }
    // Reset selected entry.
    selectedFileSystemEntry = null;
    // Disable buttons.
    enableFileSystemButtons(false);
}

// Lists the contents of the given directory.
function listDirectory(directory) {
    // Build path.
    var path = currentDirectory;
    if (path == null || currentDirectory == directory)
        path = directory;
    else {
        if (directory.endsWith("..")) {
            // Check if last slash must be removed.
            if (path.endsWith("/") && path.length > ROOT_DIRECTORY.length)
                path = path.substring(0, path.lastIndexOf("/"));
            // Move one directory up.
            path = path.substring(0, path.lastIndexOf("/"));
            if (path == "")
                path = ROOT_DIRECTORY;
        } else {
            if (!path.endsWith("/"))
                path = path + "/"
            path = path + directory;
        }
    }
    // Show loading panel.
    showFileSystemLoading(true);
    // Send request.
    $.post(
        "../ajax/fs_list_directory",
        JSON.stringify({
            "directory": path
        }),
        function(data) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process answer.
            processListDirectoryResponse(data);
        }
    ).fail(function(response) {
        // Process only if the file system window is showing.
        if (!isFileSystemShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading status.
        showFileSystemLoading(false);
    });
}

// Processes the list directory response.
function processListDirectoryResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showFileSystemLoading(false);
        // Do not continue.
        return;
    }
    // Unselect all entries.
    unselectFileSystemEntries();
    // Clear all file system entries.
    clearFileSystemEntries();
    // Set current directory.
    currentDirectory = response[ID_CURRENT_DIR];
    if (!currentDirectory.endsWith("/"))
        currentDirectory = currentDirectory + "/";
    $("#" + ID_CURRENT_DIRECTORY).text(currentDirectory);
    // Iterate over all the file system received entries.
    if (response[ID_FILES] != null && response[ID_FILES] != "undefined") {
        var fileSystemEntriesDiv = document.getElementById(ID_FILE_SYSTEM_ITEMS_CONTAINER);
        // Process response entries and create HTML elements.
        for (var entry of response[ID_FILES]) {
            var name = entry[ID_NAME].substring(currentDirectory.length);
            var lastModified = entry[ID_LAST_MODIFIED];
            if (lastModified == null || lastModified == "undefined" || lastModified == 0 || name == "..") {
                lastModified = "";
            } else {
                var date = new Date(0); // The 0 there is the key, which sets the date to the epoch
                date.setUTCSeconds(lastModified);
                lastModified = date.toLocaleString("en-US", { hour12:false });
            }
            var entryDiv = document.createElement("div");
            if (entry[ID_TYPE] == FS_TYPE_FILE)
                entryDiv.innerHTML = TEMPLATE_FILE.format(name, name, name, name, name,
                        sizeToHumanRead(entry[ID_SIZE]), lastModified);
            else if (entry[ID_TYPE] == FS_TYPE_DIRECTORY)
                entryDiv.innerHTML = TEMPLATE_DIRECTORY.format(name, name, name, name, lastModified);
            if (entryDiv.innerHTML != null && entryDiv.innerHTML != "")
                fileSystemEntriesDiv.appendChild(entryDiv);
        }
    }
    // Hide the loading status.
    showFileSystemLoading(false);
}

// Downloads the selected file.
function downloadSelectedFile() {
    // Build file path.
    var filePath = selectedFileSystemEntry.substring(PREFIX_FS.length);
    // Execute the download action.
    downloadFile(filePath);
}

// Attempts to download the given file name.
function downloadFile(fileName) {
    // Build file path.
    var path = currentDirectory + fileName;
    // Show loading panel.
    showFileSystemLoading(true);
    // Prepare data.
    var data = JSON.stringify({
            "path": path
        });
    // Send request
    $.ajax({
        type: 'POST',
        url: "../ajax/fs_download_file",
        data: data,
        cache: false,
        async: true,
        xhr: function() {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 2) {
                    if (xhr.status == 200)
                        xhr.responseType = "blob";
                    else
                        xhr.responseType = "text";
                }
            };
            return xhr;
        },
        success: function(response) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process answer.
            processDownloadFileResponse(response);
        },
        error: function(response) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
            // Hide the loading status.
            showFileSystemLoading(false);
        }
    });
}

// Processes the download file response.
function processDownloadFileResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showFileSystemLoading(false);
        // Do not continue.
        return;
    }
    // Obtain file name.
    var fileName = selectedFileSystemEntry.substring(PREFIX_FS.length)
    // Convert the Byte Data to BLOB object.
    var blob = new Blob([response], { type: "application/octetstream" });
    // Check the Browser type and download the File.
    var isIE = false || !!document.documentMode;
    if (isIE) {
        window.navigator.msSaveBlob(blob, fileName);
    } else {
        var url = window.URL || window.webkitURL;
        link = url.createObjectURL(blob);
        var a = $("<a />");
        a.attr("download", fileName);
        a.attr("href", link);
        $("body").append(a);
        a[0].click();
        $("body").remove(a);
    }
    // Hide the loading status.
    showFileSystemLoading(false);
}

// Asks user to confirm file removal.
function askRemoveFile() {
    showConfirmDialog(TITLE_CONFIRM_REMOVE, MESSAGE_CONFIRM_REMOVE,
        function() {
            // Remove the file.
            removeSelectedFile();
        },
        function() {
            // Do nothing.
        }
    );
}

// Removes the selected file.
function removeSelectedFile() {
    // Sanity checks.
    if (selectedFileSystemEntry == null)
        return;
    // Initialize variables.
    var isFile = false;
    var entryElement = document.getElementById(selectedFileSystemEntry);
    var iconElement = entryElement.children[0];
    // Check if it is a file.
    if (iconElement.classList.contains(CLASS_FA_FILE))
        isFile = true;
    // Execute action.
    removeFile(selectedFileSystemEntry.substring(PREFIX_FS.length), isFile);
}

// Attempts to remove the given file name.
function removeFile(fileName, isFile) {
    // Build file path.
    var path = currentDirectory + fileName;
    // Show loading panel.
    showFileSystemLoading(true);
    // Send request.
    $.post(
        "../ajax/fs_remove_file",
        JSON.stringify({
            "path": path,
            "is_file": isFile
        }),
        function(data) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process answer.
            processRemoveFileResponse(data);
        }
    ).fail(function(response) {
        // Process only if the file system window is showing.
        if (!isFileSystemShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading status.
        showFileSystemLoading(false);
    });
}

// Processes the remove file response.
function processRemoveFileResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showFileSystemLoading(false);
    } else {
        // List directory contents again.
        listDirectory(currentDirectory);
    }
}

// Opens the file browser.
function openFileBrowser() {
    document.getElementById(ID_FILE_TO_UPLOAD).click();
}

// Attempts to upload the given file.
function uploadFile(file) {
    // Build file path.
    var path = currentDirectory + file.name;
    // Show loading panel.
    showFileSystemLoading(true);
    // Prepare data.
    var formData = new FormData();
    formData.append("path", path);
    formData.append("file", file);
    // Send request.
    $.ajax({
        type: 'POST',
        url: "../ajax/fs_upload_file",
        data: formData,
        cache: false,
        async: true,
        processData: false,
        contentType: false,
        enctype: 'multipart/form-data',
        success: function(response) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process answer.
            processUploadFileResponse(response);
        },
        error: function(response) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
            // Hide the loading status.
            showFileSystemLoading(false);
        }
    });
}

// Processes the upload file response.
function processUploadFileResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showFileSystemLoading(false);
    } else {
        // List directory contents again.
        listDirectory(currentDirectory);
    }
}

// Opens the directory name panel.
function openDirectoryNamePanel() {
    // Initialize variables.
    var fileSystemDirName = document.getElementById(ID_FILE_SYSTEM_DIR_NAME);
    var fileSystemDirNameButton = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_BUTTON);
    var fileSystemDirNameError = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_ERROR);
    // Reset panel state.
    fileSystemDirName.value = "";
    fileSystemDirNameError.innerHTML = "&nbsp;";
    fileSystemDirNameError.style.visibility = "hidden";
    if (!fileSystemDirNameButton.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED))
        fileSystemDirNameButton.classList.add(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED);
    if (fileSystemDirName.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR))
        fileSystemDirName.classList.remove(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR);
    // Show panel.
    showDirectoryNamePanel(true);
}

// Closes the directory name panel.
function closeDirectoryNamePanel() {
    showDirectoryNamePanel(false);
}

// Opens the directory name panel.
function showDirectoryNamePanel(visible) {
    // Initialize variables.
    var fileSystemDirNamePanel = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_PANEL);
    var fileSystemDirNameError = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_ERROR);
    // Apply visible state.
    if (visible && isFileSystemShowing())
        fileSystemDirNamePanel.style.visibility = "visible";
    else {
        fileSystemDirNamePanel.style.visibility = "hidden";
        fileSystemDirNameError.style.visibility = "hidden";
    }
}

// Handles what happens when the "Create directory" button is pressed.
function onCreateDirectory() {
    var fileSystemDirName = document.getElementById(ID_FILE_SYSTEM_DIR_NAME);
    var dirName = fileSystemDirName.value;
    createDirectory(dirName);
}

// Validates the directory name.
function validateDirectoryName(dirName) {
    // Initialize variables.
    var fileSystemDirName = document.getElementById(ID_FILE_SYSTEM_DIR_NAME);
    var fileSystemDirNameButton = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_BUTTON);
    var fileSystemDirNameError = document.getElementById(ID_FILE_SYSTEM_DIR_NAME_ERROR);
    var isValid = true;
    var error = ERROR_DIR_NAME_INVALID;
    // Check if the directory name is valid.
    if (dirName == null || dirName == "") {
        isValid = false;
        error = ERROR_DIR_NAME_EMPTY;
    } else
        isValid = dirName.match(REGEX_DIRECTORY_NAME);
    // Update controls.
    if (isValid) {
        if (fileSystemDirNameButton.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED))
            fileSystemDirNameButton.classList.remove(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED);
        if (fileSystemDirName.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR))
            fileSystemDirName.classList.remove(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR);
        fileSystemDirNameError.innerHTML = "&nbsp;";
        fileSystemDirNameError.style.visibility = "hidden";
    } else {
        if (!fileSystemDirNameButton.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED))
            fileSystemDirNameButton.classList.add(CLASS_FILE_SYSTEM_DIR_NAME_BUTTON_DISABLED);
        if (!fileSystemDirName.classList.contains(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR))
            fileSystemDirName.classList.add(CLASS_FILE_SYSTEM_DIR_NAME_INPUT_ERROR);
        fileSystemDirNameError.innerHTML = error;
        fileSystemDirNameError.style.visibility = "visible";
    }
}

// Attempts to create the given directory.
function createDirectory(directoryName) {
    // Build file path.
    var path = currentDirectory + directoryName;
    // Close the directory name panel.
    closeDirectoryNamePanel();
    // Show loading panel.
    showFileSystemLoading(true);
    // Send request.
    $.post(
        "../ajax/fs_create_dir",
        JSON.stringify({
            "path": path
        }),
        function(data) {
            // Process only if the file system window is showing.
            if (!isFileSystemShowing())
                return;
            // Process answer.
            processCreateDirectoryResponse(data);
        }
    ).fail(function(response) {
        // Process only if the file system window is showing.
        if (!isFileSystemShowing())
            return;
        // Process error.
        processAjaxErrorResponse(response);
        // Hide the loading status.
        showFileSystemLoading(false);
    });
}

// Processes the create directory response.
function processCreateDirectoryResponse(response) {
    // Check if there was any error in the request.
    if (checkErrorResponse(response, false)) {
        // Hide the loading status.
        showFileSystemLoading(false);
    } else {
        // List directory contents again.
        listDirectory(currentDirectory);
    }
}
