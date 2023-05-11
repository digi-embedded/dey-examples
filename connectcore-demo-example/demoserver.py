#!/usr/bin/python3

# Copyright (c) 2022, 2023, Digi International, Inc.
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
# REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
# AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
# INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
# LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
# OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
# PERFORMANCE OF THIS SOFTWARE.

import argparse
import base64
import cgi
import errno
import hashlib
import http.server
import json
import logging
import os
import platform
import re
import shutil
import signal
import socketserver
import stat
import subprocess
import time
from json import JSONDecodeError

from digi.apix.bluetooth import BluetoothException, BluetoothDevice, BluetoothProfile
from digi.apix.exceptions import DigiAPIXException
from digi.apix.network import IPMode, NetworkException, NetStatus, NetworkInterface, NetworkProfile
from digi.apix.wifi import SecurityMode, WifiException, WifiInterface, WifiProfile
from logging.handlers import SysLogHandler
from threading import Thread, Lock

from digi.ccble.exceptions import BluetoothNotSupportedException, ConnectCoreBLEException
from digi.ccble.service import BLEInterface, ConnectCoreBLEService

# Constants.
APP_NAME = "Demo server"

PORT = 9090

EMMC_SIZE_FILE = "/sys/class/mmc_host/mmc0/mmc0:0001/block/mmcblk0/size"
NAND_SIZE_FILE = "/proc/mtd"

SIZE_KB = "KB"
SIZE_MB = "MB"
SIZE_GB = "GB"

DIVIDERS = {SIZE_KB: 1, SIZE_MB: 2, SIZE_GB: 3}

ZERO_MAC = "00:00:00:00:00:00"
ZERO_IP = "0.0.0.0"
NOT_AVAILABLE = "N/A"

ELEMENT_BLUETOOTH = "bluetooth"
ELEMENT_ETHERNET = "ethernet"
ELEMENT_INFO = "info"
ELEMENT_PING = "ping"
ELEMENT_RESTART_BLUETOOTH = "restart-bluetooth"
ELEMENT_TEST_CONNECTIVITY = "test-connectivity"
ELEMENT_WIFI = "wifi"

PREFIX_ETHERNET = "eth"
PREFIX_WIFI = "wlan"

BT_PASSWORD_FILE = "/etc/bt.pwd"
BT_PASSWORD_DEFAULT = "1234"
BT_PASSWORD_LENGTH = 16
BT_PASSWORD_SERIAL_LENGTH = 6

BT_ADVERT_NAME = "CONNECTCORE-%s"

BT_TAG_DATA = "data"
BT_TAG_DESC = "desc"
BT_TAG_ELEMENT = "element"
BT_TAG_IFACE = "iface"
BT_TAG_INDEX = "index"
BT_TAG_NAME = "name"
BT_TAG_OP = "operation"
BT_TAG_PASSWORD = "password"
BT_TAG_SETTINGS = "settings"
BT_TAG_STATUS = "status"
BT_TAG_TOTAL = "total"
BT_TAG_VALUE = "value"

BT_OP_READ = "R"
BT_OP_WRITE = "W"

BT_PAYLOAD_LIMIT = 140

BT_REQUEST_TIMEOUT = 5000

COMMAND_PING = "ping -q -w 1 -c 1 -I %s 8.8.8.8"
COMMAND_READ_SN = "fw_printenv -n serial#"

# Variables.
log = logging.getLogger(APP_NAME)
last_cpu_work = 0
last_cpu_total = 0
led_status = {}
fw_process = None


class RequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler class.
    """

    def do_OPTIONS(self):
        """
        Override.
        """
        self.send_response(200, "ok")
        self.end_headers()

    def do_GET(self):
        """
        Override.
        """
        if re.search("/ping", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Send the JSON value.
            self.wfile.write("{}".encode(encoding="utf_8"))
        else:
            # Forbidden.
            self._set_headers(403)

    def do_POST(self):
        """
        Override.
        """
        if re.search("/ajax/get_device_type", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            log.debug("Get device info")

            info = {
                "device_type": read_proc_file("/proc/device-tree/digi,machine,name")
            }

            # Send the JSON value.
            self.wfile.write(json.dumps(info).encode(encoding="utf_8"))
        elif re.search("/ajax/get_device_info", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            log.debug("Get device info")

            # Generate the JSON information.
            mem_info = get_mem_info()
            mca_versions = get_mca_version()
            info = {
                "uboot_version": read_proc_file("/proc/device-tree/digi,uboot,version"),
                "kernel_version": "%s %s %s %s %s GNU/Linux" % (platform.system(),
                                                                platform.node(),
                                                                platform.release(),
                                                                platform.version(),
                                                                platform.machine()),
                "dey_version": "DEY-%s-%s" % (get_dey_version(), read_file("/etc/version")),
                "serial_number": get_serial_number(),
                "device_type": read_proc_file("/proc/device-tree/digi,machine,name"),
                "module_variant": read_proc_file("/proc/device-tree/digi,hwid,variant"),
                "board_variant": read_proc_file("/proc/device-tree/digi,carrierboard,version"),
                "board_id": read_proc_file("/proc/device-tree/digi,carrierboard,id"),
                "mca_hw_version": mca_versions[1],
                "mca_fw_version": mca_versions[0],
                "memory_total": mem_info.get("MemTotal", NOT_AVAILABLE) if mem_info else NOT_AVAILABLE,
                "flash_size": get_storage_size(),
                "video_resolution": get_video_resolution(),
                "fw_store_path": get_fw_store_path(),
                "bluetooth_mac": get_bluetooth_mac(),
                "wifi_mac": ZERO_MAC,
                "wifi_ip": ZERO_IP,
                "ethernet0_mac": ZERO_MAC,
                "ethernet0_ip": ZERO_IP,
                "ethernet1_mac": ZERO_MAC,
                "ethernet1_ip": ZERO_IP,
            }
            # Fill ethernet interfaces data.
            try:
                interfaces = NetworkInterface.list_interfaces()
                if interfaces and "eth0" in interfaces:
                    try:
                        net_iface = NetworkInterface.get("eth0")
                        info["ethernet0_mac"] = str(net_iface.mac)
                        info["ethernet0_ip"] = str(net_iface.ipv4)
                    except NetworkException as exc2:
                        log.error("Error reading interface 'eth0' data: %s", str(exc2))
                if interfaces and "eth1" in interfaces:
                    try:
                        net_iface = NetworkInterface.get("eth1")
                        info["ethernet1_mac"] = mac_to_human_string(net_iface.mac)
                        info["ethernet1_ip"] = str(net_iface.ipv4)
                    except NetworkException as exc2:
                        log.error("Error reading interface 'eth1' data: %s", str(exc2))
            except DigiAPIXException as exc:
                log.error("Error listing network interfaces: %s", str(exc))

            # Fill WiFi interfaces data.
            try:
                interfaces = WifiInterface.list_interfaces()
                if interfaces and "wlan0" in interfaces:
                    try:
                        net_iface = WifiInterface.get("wlan0")
                        info["wifi_mac"] = mac_to_human_string(net_iface.mac)
                        info["wifi_ip"] = str(net_iface.ipv4)
                    except WifiException as exc2:
                        log.error("Error reading interface 'wlan0' data: %s", str(exc2))
            except DigiAPIXException as exc:
                log.error("Error listing network interfaces: %s", str(exc))

            # Send the JSON value.
            self.wfile.write(json.dumps(info).encode(encoding="utf_8"))
        elif re.search("/ajax/get_device_status", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            log.debug("Get device status")

            mem_info = get_mem_info()
            mem_total = int(mem_info.get("MemTotal", "-1")) if mem_info else -1
            mem_free = int(mem_info.get("MemFree", "-1")) if mem_info else -1
            mem_used = (mem_total - mem_free) if (mem_total > 0 and mem_free > 0) else -1

            status = {
                "system_monitor/cpu_load": get_cpu_load(),
                "system_monitor/cpu_temperature": get_cpu_temp(),
                "system_monitor/frequency": read_file("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_cur_freq").strip(),
                "system_monitor/uptime": get_uptime(),
                "system_monitor/free_memory": mem_free,
                "system_monitor/used_memory": mem_used,
                "system_monitor/led_status": get_led_status("USER_LED")
            }

            # Fill bluetooth devices data.
            try:
                bt_devices = BluetoothDevice.list_devices() or []
                for device in bt_devices:
                    try:
                        bt_device = BluetoothDevice.get(device)
                        statistics = bt_device.get_statistics()
                        status[f"system_monitor/{device}/state"] = 1 if \
                            bt_device.is_enabled else 0
                        status[f"system_monitor/{device}/rx_bytes"] = statistics.rx_bytes
                        status[f"system_monitor/{device}/tx_bytes"] = statistics.tx_bytes
                    except NetworkException as exc2:
                        log.error("Error reading bluetooth device '%s' data: %s", device, str(exc2))
            except DigiAPIXException as exc:
                log.error("Error listing bluetooth devices: %s", str(exc))

            # Fill ethernet interfaces data.
            try:
                interfaces = NetworkInterface.list_interfaces() or []
                for iface in interfaces:
                    try:
                        net_iface = NetworkInterface.get(iface)
                        statistics = net_iface.get_statistics()
                        status[f"system_monitor/{iface}/state"] = 1 if \
                            net_iface.status == NetStatus.CONNECTED else 0
                        status[f"system_monitor/{iface}/rx_bytes"] = statistics.rx_bytes
                        status[f"system_monitor/{iface}/tx_bytes"] = statistics.tx_bytes
                    except NetworkException as exc2:
                        log.error("Error reading interface '%s' data: %s", iface, str(exc2))
            except DigiAPIXException as exc:
                log.error("Error listing network interfaces: %s", str(exc))

            # Fill WiFi interfaces data.
            try:
                interfaces = WifiInterface.list_interfaces() or []
                for iface in interfaces:
                    try:
                        wifi_iface = WifiInterface.get(iface)
                        statistics = wifi_iface.get_statistics()
                        status[f"system_monitor/{iface}/state"] = 1 if \
                            wifi_iface.status == NetStatus.CONNECTED else 0
                        status[f"system_monitor/{iface}/rx_bytes"] = statistics.rx_bytes
                        status[f"system_monitor/{iface}/tx_bytes"] = statistics.tx_bytes
                    except WifiException as exc2:
                        log.error("Error reading interface '%s' data: %s", iface, str(exc2))
            except DigiAPIXException as exc:
                log.error("Error listing WiFi interfaces: %s", str(exc))

            # Send the JSON value.
            self.wfile.write(json.dumps(status).encode(encoding="utf_8"))
        elif re.search("/ajax/set_led_value", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            led = json.loads(data.decode("utf-8")).get("led_name", None)
            value = json.loads(data.decode("utf-8")).get("value", None)

            log.debug("Set LED %s to %s", led, value)

            if not led or value is None:
                error = "Invalid LED name" if not led else "Invalid LED value"
                log.error("Error setting LED '%s': %s", led, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            error = set_led_status(led, value)

            # Send the JSON value.
            if error:
                log.error("Error setting LED '%s': %s", led, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            self.wfile.write("{}".encode(encoding="utf_8"))
        elif re.search("/ajax/play_music", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            play = json.loads(data.decode("utf-8")).get("play", None)
            music_file = json.loads(data.decode("utf-8")).get("music_file", None)

            log.debug("Play music: %s", play)
            if music_file:
                log.debug("Music file: %s", music_file)

            play_music(play, music_file)

            # Send the JSON value.
            self.wfile.write(json.dumps({"play": play}).encode(encoding="utf_8"))
        elif re.search("/ajax/set_audio_volume", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            value = json.loads(data.decode("utf-8")).get("value", None)

            log.debug("Set audio volume to %s", value)

            if value is None or value > 100 or value < 0:
                error = "Invalid volume value"
                log.error("Error setting audio volume to '%s%%': %s", value, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            error = set_audio_volume(value)

            # Send the JSON value.
            if error:
                log.error("Error setting audio volume to '%s%%': %s", value, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            # Send the JSON value.
            self.wfile.write("{}".encode(encoding="utf_8"))
        elif re.search("/ajax/fs_list_directory", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            path = json.loads(data.decode("utf-8")).get("directory", None)
            filters = json.loads(data.decode("utf-8")).get("filters", None)

            log.debug("List directory: %s (filters %s)", path, filters)

            if not path or not os.path.exists(path):
                error = "Invalid path" if not path else "No such file or directory"
                log.error("Error listing directory '%s': %s", path, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            work_path = os.path.realpath(path)
            tmp_list = []

            for item in os.listdir(work_path):
                item_path = os.path.join(path, item)
                item_work_path = os.path.realpath(item_path)
                st = os.stat(item_work_path)
                if not os.path.isdir(item_work_path):
                    if not filter_by_extension(item_path, filters):
                        continue
                item = {
                    "type": "dir" if os.path.isdir(item_work_path) else "file",
                    "name": os.path.join(path, item),
                    "last_modified": st[stat.ST_MTIME],
                }
                if os.path.isfile(item_work_path):
                    item["size"] = st[stat.ST_SIZE]
                tmp_list.append(item)

            f_list = sorted(tmp_list, key=lambda item: (item["type"], os.path.basename(item["name"])))

            # Add item '..'
            if os.path.dirname(work_path) != work_path:
                f_list.insert(0, {
                    "type": "dir",
                    "name": os.path.join(path, ".."),
                    "last_modified": os.stat(os.path.join(path, "..")),
                })

            # Send the JSON value.
            self.wfile.write(json.dumps({"current_dir": path, "files": f_list}).encode(encoding="utf_8"))
        elif re.search("/ajax/fs_remove_file", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            path = json.loads(data.decode("utf-8")).get("path", None)

            log.debug("Remove file: %s", path)

            if not path or not os.path.exists(path):
                error = "Invalid path" if not path else "No such file or directory"
                log.error("Error removing file '%s': %s", path, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            try:
                os.remove(path)
                self.wfile.write("{}".encode(encoding="utf_8"))
            except OSError as e:
                self.wfile.write(json.dumps({"error": e.strerror}).encode(encoding="utf_8"))
                log.error("Error removing file '%s': %s", e.filename, e.strerror)
                return

        elif re.search("/ajax/fs_create_dir", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            path = json.loads(data.decode("utf-8")).get("directory", None)

            log.debug("Create directory: %s", path)

            if not path:
                log.error("Error creating directory '%s': Invalid directory", path)
                self.wfile.write(json.dumps({"error": "Invalid directory"}).encode(encoding="utf_8"))
                return

            try:
                os.makedirs(path, exist_ok=True)
            except OSError as e:
                self.wfile.write(json.dumps({"error": e.strerror}).encode(encoding="utf_8"))
                log.error("Error creating directory '%s': %s", path, e.strerror)
                return

            self.wfile.write("{}".encode(encoding="utf_8"))
        elif re.search("/ajax/fs_download_file", self.path) is not None:
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            path = json.loads(data.decode("utf-8")).get("path", None)

            log.debug("Download file: %s", path)

            if not path:
                self._set_headers(200)
                log.error("Error downloading file '%s': Invalid path", path)
                self.wfile.write(json.dumps({"error": "Invalid path"}).encode(encoding="utf_8"))
                return

            work_path = os.path.realpath(path)
            try:
                with open(work_path, "rb") as f:
                    contents = f.read()
            except OSError as e:
                self._set_headers(200)
                log.error("Error downloading file '%s': %s", path, e.strerror)
                self.wfile.write(json.dumps({"error": e.strerror}).encode(encoding="utf_8"))
                return

            self.send_response(200)
            self.send_header("Content-type", "application/octet-stream")
            self.end_headers()
            self.wfile.write(contents)
        elif re.search("/ajax/fs_upload_file", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Get the data.
            ctype, pdict = cgi.parse_header(self.headers['content-type'])
            if "boundary" in pdict:
                pdict["boundary"] = pdict["boundary"].encode()
            data = cgi.parse_multipart(self.rfile, pdict)
            path = data.get("path", [None])[0]
            f_data = data.get("file", [bytes()])[0]
            overwrite = data.get("overwrite", [False])[0]
            error = None

            log.debug("Upload file: %s (overwrite %s)", path, overwrite)

            if not path:
                error = "Invalid path"
            elif os.path.exists(path):
                if not overwrite:
                    error = "File already exists"
                else:
                    try:
                        os.remove(path)
                    except OSError as e:
                        error = e.strerror

            if error:
                log.error("Error uploading file '%s': %s", path, error)
                self.wfile.write(json.dumps({"error": error}).encode(encoding="utf_8"))
                return

            work_path = os.path.realpath(path)
            try:
                with open(work_path, "xb") as f:
                    f.write(f_data)
                self.wfile.write("{}".encode(encoding="utf_8"))
            except OSError as e:
                log.error("Error uploading file '%s': %s", path, e.strerror)
                self.wfile.write(json.dumps({"error": e.strerror}).encode(encoding="utf_8"))
        elif re.search("/ajax/reboot_device", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            log.debug("Reboot device")

            # Send the JSON value.
            self.wfile.write("{}".encode(encoding="utf_8"))

            exec_cmd("reboot")
        elif re.search("/ajax/update_firmware", self.path) is not None:
            global fw_process

            # Set the response headers.
            self._set_headers(200)
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            path = json.loads(data.decode("utf-8")).get("file", None)

            log.debug("Update firmware with file %s", path)
            if not is_dual_system() and not path.startswith(get_fw_store_path())\
                    and shutil.disk_usage(get_fw_store_path())[2] >= os.path.getsize(path):
                # Move the package to /mnt/update to avoid permission problems
                update_path = os.path.join(get_fw_store_path(), os.path.basename(path))
                if os.path.exists(update_path):
                    os.remove(update_path)
                shutil.move(path, update_path)
                path = update_path
            cmd = "update-firmware %s" % path
            log.debug("Update cmd: %s", cmd)

            try:
                fw_process = subprocess.Popen(cmd, stdout=subprocess.PIPE,
                                              stderr=subprocess.STDOUT,
                                              shell=True, text=True)
                self.wfile.write("{}".encode(encoding="utf_8"))
            except OSError as e:
                log.error("Error updating firmware '%s': %s", path, e.strerror)
                self.wfile.write(json.dumps({"error": e.strerror}).encode(encoding="utf_8"))
                fw_process = None
            except subprocess.SubprocessError as e:
                log.error("Error updating firmware '%s': %s", path, e.stdout)
                self.wfile.write(json.dumps({"error": e.stdout}).encode(encoding="utf_8"))
                fw_process = None

            if is_dual_system() and os.path.exists(path):
                os.remove(path)
        elif re.search("/ajax/check_firmware_update_running", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            is_running = (fw_process.poll() is not None) if fw_process else False

            log.debug("Update firmware is running %s", is_running)

            self.wfile.write(json.dumps({"update-running": is_running}).encode(encoding="utf_8"))
        elif re.search("/ajax/check_firmware_update_status", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            status = "successful"
            if fw_process:
                ret = fw_process.poll()
                if ret is None:
                    status = "active"
                elif ret != 0:
                    status = "failed"

            log.debug("Update firmware status %s", status)

            self.wfile.write(json.dumps({"status": status}).encode(encoding="utf_8"))
        elif re.search("/ajax/check_firmware_update_progress", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            progress = 100
            if fw_process and fw_process.poll() is None:
                progress = "?"
            self.wfile.write(json.dumps({"progress": progress, "message": "Updating firmware"}).encode(encoding="utf_8"))
        elif re.search("/ajax/get_config", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            elements = json.loads(data.decode("utf-8")).get("elements", None)
            # Fill configuration data.
            config_data = get_elements_configuration(elements)
            # Send the answer.
            if "error" in config_data:
                self.wfile.write(json.dumps(config_data).encode(encoding="utf_8"))
            else:
                self.wfile.write(json.dumps(
                    {"data": json.dumps(config_data)}).encode(encoding="utf_8"))
        elif re.search("/ajax/set_config", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)
            # Get the JSON data.
            data = self.rfile.read(int(self.headers["Content-Length"]))
            configuration = json.loads(data.decode("utf-8")).get("configuration", None)
            # Apply configuration.
            result = set_configuration(configuration)
            # Send the answer.
            if "error" in result:
                self.wfile.write(json.dumps(result).encode(encoding="utf_8"))
            else:
                self.wfile.write(json.dumps({"data": json.dumps(result)}).encode(encoding="utf_8"))
        else:
            # Forbidden.
            self._set_headers(403)

    def end_headers(self):
        """
        Override.
        """
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Origin", "*")
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def _set_headers(self, status):
        """
        Sets the status and heders of the response.

        Args:
            status (Integer): The status code of the response.
        """
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.end_headers()


class BluetoothService:
    def __init__(self):
        self._last_request_chunk_time = 0
        self._request_chunks = []
        self._ble_service = None
        self._ble_thread = None
        self._lock = Lock()

    def start(self):
        """
        Start Bluetooth service.
        """
        with self._lock:
            try:
                self._ble_service = ConnectCoreBLEService.get_instance(ble_interface=BLEInterface.ADAPTER)
                self._ble_service.add_connect_callback(self._connection_cb)
                self._ble_service.add_data_received_callback(self._data_received_cb)
                self._ble_service.set_password(get_bt_password())
                self._ble_service.set_advertising_name(get_bt_advertising_name())
                self._ble_thread = Thread(target=self._ble_service.start, daemon=True)
                self._ble_thread.start()
                return True
            except BluetoothNotSupportedException:
                log.warning("The system does not support Bluetooth")
                return False

    def stop(self):
        """
        Stop Bluetooth service.
        """
        with self._lock:
            if self._ble_service:
                self._ble_service.remove_data_received_callback(self._data_received_cb)
                self._ble_service.remove_connect_callback(self._connection_cb)
                self._ble_service.stop()
            if self._ble_thread:
                self._ble_thread.join()
                self._ble_thread = None

    def restart(self):
        """
        Restarts the Bluetooth service.
        """
        time.sleep(0.5)
        self.stop()
        time.sleep(1)
        self.start()

    def _connection_cb(self):
        """
        Callback to be notified when a new Bluetooth connection is established.
        """
        log.info("New connection (type: '%s')", self._ble_service.get_interface_type().title)

    def _data_received_cb(self, data):
        """
        Callback to be notified when new Bluetooth data is received.
            - For a read request, send back the configuration data.
            - For a write request, update the configuration.

        Args:
            data (Bytearray): received (JSON) data.
        """
        # Check if request chunks list must be reset.
        if time.time() * 1000 > self._last_request_chunk_time + BT_REQUEST_TIMEOUT:
            self._request_chunks = []
        self._last_request_chunk_time = time.time() * 1000
        # Process request chunk.
        try:
            request_chunk = json.loads(data.decode("utf-8"))
        except JSONDecodeError as exc:
            self._send_error(None, f"Invalid JSON data from Bluetooth: {str(exc)}")
            return
        if request_chunk[BT_TAG_INDEX] is None or request_chunk[BT_TAG_TOTAL] is None \
                or request_chunk[BT_TAG_DATA] is None:
            self._send_error(None, "Invalid JSON data struct from Bluetooth")
            return
        # Extract request chunk data.
        self._request_chunks.insert(request_chunk[BT_TAG_INDEX] - 1, request_chunk[BT_TAG_DATA])
        # Check if request is complete.
        if len(self._request_chunks) == request_chunk[BT_TAG_TOTAL]:
            # Build request.
            encoded_data = "".join(chunk for chunk in self._request_chunks)
            self._request_chunks = []
            request = self._get_request(base64.b64decode(encoded_data))
            if not request:
                return
            self._process_request(request)

    def _get_request(self, data):
        """
        Checks if a request follows the format:

        {
            "element"  : "<info, wifi, ethernet>", required: optional, default=info
            "iface"    : "<iface_name>",           required: element=wifi or element=ethernet
            "operation": "R" / "W",                required: optional, default=R
            "settings"                             required: always
            [
                {
                    "name"  : "<setting_name>",    required: always
                    "value" : "<setting_value>"    required: Operation=W
                },
                . . .
            ]
        }

        Args:
            data (Bytearray): Received (JSON) data.

        Returns:
            Dictionary: A dictionary, `None` if request is invalid.
        """
        try:
            req = json.loads(data.decode("utf-8"))
        except JSONDecodeError as exc:
            self._send_error(None, f"Invalid JSON data from Bluetooth: {str(exc)}")
            return None

        if (req.get(BT_TAG_ELEMENT, ELEMENT_INFO) == ELEMENT_INFO
                and req.get(BT_TAG_OP, BT_OP_READ) != BT_OP_READ):
            self._send_error(req,
                             f"Invalid request format: '{req.get(BT_TAG_OP, BT_OP_READ)}' "
                             f"not allowed for '{ELEMENT_INFO}'")
            return None

        invalid_tag = None
        if (req.get(BT_TAG_ELEMENT, ELEMENT_INFO) in (ELEMENT_ETHERNET, ELEMENT_WIFI)
                and not req.get(BT_TAG_IFACE, None)):
            invalid_tag = BT_TAG_IFACE
        elif (req.get(BT_TAG_ELEMENT, ELEMENT_INFO) not in (ELEMENT_TEST_CONNECTIVITY,
                                                            ELEMENT_RESTART_BLUETOOTH,
                                                            ELEMENT_PING)
              and BT_TAG_SETTINGS not in req):
            invalid_tag = BT_TAG_SETTINGS
        elif (req.get(BT_TAG_OP, BT_OP_READ) == BT_OP_WRITE
              and not all(BT_TAG_VALUE in setting for setting in req.get(BT_TAG_SETTINGS, None))):
            invalid_tag = BT_TAG_VALUE

        if invalid_tag:
            self._send_error(req, f"Invalid request format: '{invalid_tag}' not specified")
            req = None

        return req

    def _process_request(self, request):
        """
        Processes the request.

        Args:
            request (Dictionary): JSON string to be processed.
        """
        print(f"REQUEST: {request}")
        element = request.get(BT_TAG_ELEMENT, ELEMENT_INFO)

        if element == ELEMENT_INFO:
            self._process_info_request(request)
        elif element in (ELEMENT_ETHERNET, ELEMENT_WIFI):
            self._process_net_request(request)
        elif element == ELEMENT_BLUETOOTH:
            self._process_bluetooth_request(request)
        elif element == ELEMENT_TEST_CONNECTIVITY:
            self._process_test_connection_request(request)
        elif element == ELEMENT_PING:
            self._process_ping_request()
        elif element == ELEMENT_RESTART_BLUETOOTH:
            self._process_restart_bluetooth()
        else:
            self._send_error(request, f"Element '{element}' not found")
            return

    def _process_info_request(self, request):
        """
        Processes an 'info' request.

        Args:
            request (Dictionary): The info request.
        """
        settings = request.get(BT_TAG_SETTINGS, None)
        for setting in settings:
            setting_name = setting[BT_TAG_NAME]
            if setting_name == "uboot_version":
                setting_value = read_proc_file("/proc/device-tree/digi,uboot,version")
            elif setting_name == "kernel_version":
                setting_value = f"{platform.system()} " \
                                f"{platform.node()} " \
                                f"{platform.release()} " \
                                f"{platform.version()} " \
                                f"{platform.machine()} GNU/Linux"
            elif setting_name == "dey_version":
                setting_value = f"DEY-{get_dey_version()}-{read_file('/etc/version')}"
            elif setting_name == "device_type":
                setting_value = read_proc_file("/proc/device-tree/digi,machine,name")
            elif setting_name == "ethernet0_mac":
                setting_value = get_ethernet_mac()
            elif setting_name == "n_eth":
                setting_value = 0
                net_ifaces = NetworkInterface.list_interfaces()
                for net_iface in net_ifaces:
                    setting_value = setting_value + 1 \
                        if net_iface.startswith("eth")else setting_value
            elif setting_name == "variant":
                setting_value = read_proc_file("/proc/device-tree/digi,hwid,variant")
            elif setting_name == "serial":
                setting_value = get_serial_number()
            else:
                self._send_error(request, f"Invalid '{ELEMENT_INFO}' setting: '{setting_name}'")
                return
            setting[BT_TAG_VALUE] = setting_value

        resp = {BT_TAG_STATUS: 0,
                BT_TAG_ELEMENT: ELEMENT_INFO,
                BT_TAG_SETTINGS: settings}

        self._send_data(json.dumps(resp).encode('utf-8'))

    def _process_net_request(self, request):
        """
        Processes a 'ethernet' or 'wifi' request.

        Args:
            request (Dictionary): The request.
        """
        element = request.get(BT_TAG_ELEMENT, ELEMENT_ETHERNET)
        iface_name = request.get(BT_TAG_IFACE, None)
        settings = request.get(BT_TAG_SETTINGS, None)
        operation = request.get(BT_TAG_OP, BT_OP_READ)

        if operation == BT_OP_READ:
            try:
                res = get_network_iface_configuration(iface_name)
            except DigiAPIXException as exc:
                self._send_error(request, f"Error getting interface configuration: {str(exc)}")
                return

            for setting in settings:
                setting[BT_TAG_VALUE] = res.get(setting[BT_TAG_NAME], None)
                if setting[BT_TAG_VALUE] is None:
                    self._send_error(request, f"Invalid '{iface_name}' setting: "
                                              f"'{setting[BT_TAG_NAME]}'")
                    return

            resp = {BT_TAG_STATUS: 0,
                    BT_TAG_ELEMENT: element,
                    BT_TAG_IFACE: iface_name,
                    BT_TAG_SETTINGS: settings}
        else:
            cfg = {}
            for setting in settings:
                cfg[setting[BT_TAG_NAME]] = setting[BT_TAG_VALUE]
            res = set_network_iface_configuration(iface_name, cfg)
            if res.get("status", None) == 1:
                self._send_error(request, f"Error setting '{iface_name}' "
                                          f"configuration: {res.get('desc', '')}")
                return
            resp = {BT_TAG_STATUS: 0,
                    BT_TAG_ELEMENT: element,
                    BT_TAG_IFACE: iface_name,
                    BT_TAG_SETTINGS: settings}

        self._send_data(json.dumps(resp).encode('utf-8'))

    def _process_bluetooth_request(self, request):
        """
        Processes a 'bluetooth' request.

        Args:
            request (Dictionary): The request.
        """
        settings = request.get(BT_TAG_SETTINGS, None)
        operation = request.get(BT_TAG_OP, BT_OP_READ)

        if operation == BT_OP_READ:
            try:
                res = get_bluetooth_device_configuration(0)
            except DigiAPIXException as exc:
                self._send_error(request, f"Error getting bluetooth configuration: {str(exc)}")
                return

            for setting in settings:
                setting[BT_TAG_VALUE] = res.get(setting[BT_TAG_NAME], None)
                if setting[BT_TAG_VALUE] is None:
                    self._send_error(request, f"Invalid 'bluetooth' setting: "
                                              f"'{setting[BT_TAG_NAME]}'")
                    return

            resp = {BT_TAG_STATUS: 0,
                    BT_TAG_ELEMENT: ELEMENT_BLUETOOTH,
                    BT_TAG_SETTINGS: settings}
        else:
            # For the moment, attend only 'password' setting.
            for setting in settings:
                if setting[BT_TAG_NAME] == BT_TAG_PASSWORD:
                    if not save_bt_password(setting[BT_TAG_VALUE]):
                        self._send_error(request, "Error saving Bluetooth password")
                        return

            resp = {BT_TAG_STATUS: 0,
                    BT_TAG_ELEMENT: ELEMENT_BLUETOOTH,
                    BT_TAG_SETTINGS: settings}

        self._send_data(json.dumps(resp).encode('utf-8'))

    def _process_test_connection_request(self, request):
        """
        Processes a 'test-connectivity' request.

        Args:
            request (Dictionary): The request.
        """
        interface = request.get(BT_TAG_IFACE, None)

        if not test_interface_connection(interface):
            self._send_error(request, f"Connectivity error in '{interface}'")
            return

        resp = {BT_TAG_STATUS: 0,
                BT_TAG_ELEMENT: ELEMENT_TEST_CONNECTIVITY}

        self._send_data(json.dumps(resp).encode('utf-8'))

    def _process_restart_bluetooth(self):
        """
        Processes a 'restart-bluetooth' request.
        """
        # No answer can be sent as connection will be closed.
        restart_thread = Thread(target=self.restart)
        restart_thread.start()

    def _process_ping_request(self):
        """
        Processes a 'ping' request.
        """
        resp = {BT_TAG_STATUS: 0, BT_TAG_ELEMENT: ELEMENT_PING}

        self._send_data(json.dumps(resp).encode('utf-8'))

    def _send_data(self, data):
        """
        Sends data to the Bluetooth connected device.

        Args:
            data (Bytearray): Data to be sent.
        """
        print(f"REQUEST ANSWER: {data}")
        try:
            encoded_data = base64.b64encode(data).decode('utf-8')
            total_chunks = (int(len(encoded_data) / BT_PAYLOAD_LIMIT)) + \
                           (1 if len(encoded_data) % BT_PAYLOAD_LIMIT != 0 else 0)
            chunk_index = 0
            while chunk_index < total_chunks:
                chunk_data = {
                    BT_TAG_INDEX: chunk_index + 1,
                    BT_TAG_TOTAL: total_chunks,
                    BT_TAG_DATA: encoded_data[chunk_index * BT_PAYLOAD_LIMIT: chunk_index *
                                              BT_PAYLOAD_LIMIT + BT_PAYLOAD_LIMIT]
                }
                self._ble_service.send_data(json.dumps(chunk_data).encode('utf-8'))
                chunk_index += 1
        except ConnectCoreBLEException as exc:
            log.error("Unable send data to connected device: %s", str(exc))

    def _send_error(self, request, msg):
        """
        Sends an error message to the client.

        Args:
            request (Dictionary): Original request.
            msg (String): Error message to send.
        """
        log.error(msg)
        resp = {BT_TAG_STATUS: 1}
        if request:
            element = request.get(BT_TAG_ELEMENT, ELEMENT_INFO)
            iface = request.get(BT_TAG_IFACE, None)
            resp.update({BT_TAG_ELEMENT: element})
            if iface is not None:
                resp.update({BT_TAG_IFACE: iface})

        resp.update({BT_TAG_DESC: msg})
        self._send_data(json.dumps(resp).encode('utf-8'))


def filter_by_extension(name, filters):
    """
    Returns whether the provided name ends with one of the provided filters.

    Args:
        name (String): Name of the file to check.
        filters (String): Comma-separated extensions.

    Returns:
        Boolean: True if the file ends with one of the filters, False otherwise.
    """
    if not filters:
        return True

    for ext in filters.split(","):
        if name.endswith(ext):
            return True

    return False


def get_uptime():
    """
    Gets the system uptime in seconds.

    Returns:
        Float: The system uptime, -1 if fails.
    """
    uptime = read_proc_file("/proc/uptime").strip()
    if uptime == NOT_AVAILABLE:
        return -1

    uptime = uptime.split()
    try:
        val = float(uptime[0]) if len(uptime) > 0 else -1
        return int(val)
    except ValueError:
        return -1


def get_cpu_temp():
    """
    Gets the CPU temperature in Celsius.

    Returns:
        Float: The CPU temperature, -1 if fails.
    """
    temp = read_file("/sys/class/thermal/thermal_zone0/temp").strip()
    if temp == NOT_AVAILABLE:
        return -1
    try:
        return int(int(temp) / 1000)
    except ValueError:
        return -1


def get_cpu_load():
    """
    Gets the CPU load of the system in percentage.

    Returns:
        Float: The CPU load, -1 if fails.
    """
    global last_cpu_work
    global last_cpu_total

    stat_info = read_proc_file("/proc/stat")
    if stat_info == NOT_AVAILABLE:
        return -1

    lines = stat_info.splitlines()
    if not lines:
        return -1

    fields = lines[0].split()
    if not fields or len(fields) < 5:
        return -1

    work = 0
    for i in range(1, 4):
        work += int(fields[i])
    total = 0
    for i in range(1, len(fields) - 1):  # Remove first
        total += int(fields[i])

    if not last_cpu_work and not last_cpu_total:
        usage = 0
    else:
        usage = (work - last_cpu_work) * 100.0 / (total - last_cpu_total)

    last_cpu_total = total
    last_cpu_work = work

    return usage


def get_storage_size():
    """
    Gets the internal storage size in kB.

    Returns:
        Integer: The internal storage size, -1 if fails.
    """
    if os.path.exists(EMMC_SIZE_FILE):
        return get_emmc_size()
    if os.path.exists(NAND_SIZE_FILE):
        return get_nand_size()
    return -1


def get_emmc_size():
    """
    Gets the internal eMMC storage size in KB.

    Returns:
        Integer: The internal eMMC storage size, -1 if fails.
    """
    size = read_file(EMMC_SIZE_FILE)
    if size == NOT_AVAILABLE:
        return -1
    try:
        return int(resize_to(int(size) * 512, SIZE_KB))
    except ValueError:
        return -1


def get_nand_size():
    """
    Gets the internal NAND storage size in KB.

    Returns:
        Integer: The internal NAND storage size, -1 if fails.
    """
    total_size = 0
    mtd_contents = read_file(NAND_SIZE_FILE)
    if mtd_contents == NOT_AVAILABLE:
        return -1
    for line in mtd_contents.splitlines():
        if line.startswith("mtd"):
            fields = line.split()
            if len(fields) < 4:
                continue
            try:
                total_size += int(fields[1], 16)
            except ValueError:
                return -1

    return total_size / 1024  # kB


def get_video_resolution():
    """
    Gets the video resolution.

    Returns:
        String: Video resolution.
    """
    res = read_file("/sys/class/drm/card0/card0-HDMI-A-1/modes")
    if res == NOT_AVAILABLE:
        res = read_file("/sys/class/drm/card0/card0-DPI-1/modes")
    if res == NOT_AVAILABLE:
        res = read_file("/sys/class/graphics/fb0/modes")
    if res == NOT_AVAILABLE or not res:
        return "No video device found"

    line = res.splitlines()[0]
    if ":" in line:
        line = line.split(":")[1]
    return line.strip()


def is_dual_system():
    """
    Returns wherther is a dual system.

    Returns:
        Boolean: True for dual systems, False otherwise.
    """
    res = exec_cmd("fw_printenv -n dualboot")
    return res[0] == 0 and res[1] == "yes"


def get_fw_store_path():
    """
    Returns the path to store an image before an update.

    Returns:
        String: Absolute path to store a firmware image.
    """
    if is_dual_system():
        return "/home/root/"

    return "/mnt/update/"


def get_mem_info():
    """
    Gets a dictionary with memory info.

    Returns:
        Dictionary: A dictionary with memory information, None if fails.
    """
    mem_info = read_file("/proc/meminfo")
    if mem_info == NOT_AVAILABLE:
        return None

    return dict((line.split()[0].rstrip(':'), int(line.split()[1])) for line in mem_info.splitlines())


def get_dey_version():
    """
    Gets the DEY version.

    Returns:
        String: DEY version, "N/A" if it fails.
    """
    build_info = read_file("/etc/build")
    if build_info == NOT_AVAILABLE:
        return NOT_AVAILABLE
    for line in build_info.splitlines():
        m = re.search("DISTRO_VERSION = (.*)", line)
        if m:
            return m.group(1)

    return NOT_AVAILABLE


def get_mca_version():
    """
    Gets MCA firmware and hardware versions.

    Returns:
        Tuple(String, String): Tuple with firmware and hardware versions.
    """
    fw_version = None
    hw_version = None
    for dir_path, _, file_names in os.walk("/sys/devices"):
        for name in file_names:
            if name == "fw_version":
                fw_version = read_file(os.path.join(dir_path, name))
            elif name == "hw_version":
                hw_version = read_file(os.path.join(dir_path, name))
            if fw_version and hw_version:
                return fw_version, hw_version

    return NOT_AVAILABLE, NOT_AVAILABLE


def get_serial_number():
    """
    Gets the device serial number.

    Returns:
        String: The device serial number.
    """
    code, serial = exec_cmd(COMMAND_READ_SN)
    if code == 0:
        return serial.strip()

    return read_proc_file("/proc/device-tree/digi,hwid,sn")


def get_bluetooth_mac():
    """
    Gets the device Bluetooth MAC address.

    Returns:
        String: The Bluetooth MAC address.
    """
    bt_mac = ZERO_MAC
    try:
        bt_devices = BluetoothDevice.list_devices()
        if bt_devices and "hci0" in bt_devices:
            try:
                bt_device = BluetoothDevice.get("hci0")
                bt_mac = mac_to_human_string(bt_device.mac)
            except BluetoothException as exc2:
                log.error("Error reading interface 'hci0' data: %s", str(exc2))
    except DigiAPIXException as exc:
        log.error("Error listing bluetooth devices: %s", str(exc))

    return bt_mac


def get_ethernet_mac():
    """
    Gets the device Bluetooth MAC address.

    Returns:
        String: The Bluetooth MAC address.
    """
    eth_mac = ZERO_MAC
    try:
        net_iface = NetworkInterface.get("eth0")
        eth_mac = str(net_iface.mac)
    except NetworkException as exc:
        log.error("Error getting eth0 MAC: %s", str(exc))

    return eth_mac


def get_bt_advertising_name():
    """
    Gets the Bluetooth advertising name.

    Returns:
        String: The Bluetooth advertising name.
    """
    # The advertising name must be a value well known by both sides: the device and the mobile app.
    # The mobile app only has access to the scanned label values, which includes the ETH MAC and
    # uses it to calculate the device BT MAC address. For devices with only one ethernet interface,
    # the BT MAC is the ETH MAC + 2, but for devices with 2 ethernet interfaces, the BT MAC is the
    # ETH MAC + 3. Since with the scanned label it is impossible to determine for the mobile app
    # whether the device has 1 or 2 ethernet interfaces, we will be using the ETH0 MAC address as
    # the advertised name, which is well known in both sides instead of trying to determine the
    # real BT MAC.
    mac = get_ethernet_mac().replace(":", "")
    mac_tail = f"{mac[-4:]}".upper()

    return BT_ADVERT_NAME % mac_tail


def get_bt_password():
    """
    Gets the Bluetooth password.

    Returns:
        String: The Bluetooth password.
    """
    # Check first if password is saved in file.
    password = read_file(BT_PASSWORD_FILE)
    if not password or password == NOT_AVAILABLE:
        # Generate password using Serial number.
        password = get_serial_number()
        if not password or password == NOT_AVAILABLE:
            # Use default password
            password = BT_PASSWORD_DEFAULT
        else:
            # Use only the last 6 positions of the serial.
            password = password[-1 * BT_PASSWORD_SERIAL_LENGTH:]
        # Hash the plain password and return 16 last characters.
        password_hash = hashlib.sha256(password.encode())
        password = password_hash.hexdigest().lower()

    return password[-1 * BT_PASSWORD_LENGTH:]


def save_bt_password(password):
    """
    Saves the Bluetooth password.

    Params:
        password (String): The password to save.

    Returns:
        Boolean: 'True' if success, 'False' otherwise.
    """
    # Hash the plain password and save the 16 last characters.
    password_hash = hashlib.sha256(password.encode())
    password = password_hash.hexdigest().lower()

    return write_file(BT_PASSWORD_FILE, password)


def test_interface_connection(interface):
    """
    Tests the given interface connectivity.

    Returns:
        Boolean: 'True' if success, 'False' otherwise.
    """
    code, _ = exec_cmd(COMMAND_PING % interface)

    return code == 0


def get_led_status(name):
    """
    Get the LED value.

    Args:
        name (String): LED name in '/etc/libdigiapix.conf', if not the format
            must be '<chip> <led>', i.e, 'mca-gpio 12'.

    Returns:
        Boolean: True if LED is on, False otherwise.
    """
    value = led_status.get(name, None)
    if value is None:
        value = led_status.get(name.lower(), False)
    return value


def set_led_status(name, value):
    """
    Set the LED value.

    Args:
        name (String): LED name in '/etc/libdigiapix.conf', if not the format
            must be '<chip> <led>', i.e, 'mca-gpio 12'.
        value (Boolean): True to switch on the LED, False otherwise.

    Returns:
        String: An empty string if success, the error description if fails.
    """
    chip, led = get_led_by_alias(name)
    if not chip or not led:
        cmd = "gpioset %s=%s" % (name, "1" if value else "0")
    else:
        cmd = "gpioset %s %s=%s" % (chip, led, "1" if value else "0")

    res = exec_cmd(cmd)
    if res[0] != 0:
        return res[1]

    led_status[name] = value

    return ""


def get_led_by_alias(alias):
    """
    Get LED chip and line.

    Args:
        alias (String): LED name in '/etc/libdigiapix.conf'.

    Returns:
        Tuple (String, String): LED chip name and line. If not found, both are None.
    """
    apix_info = read_file("/etc/libdigiapix.conf")
    if apix_info == NOT_AVAILABLE:
        return None, None

    apix_values = {}
    for line in apix_info.splitlines():
        key, val = line.partition("=")[::2]
        apix_values[key.strip()] = val.strip()

    led_loc = apix_values.get(alias, None)
    if not led_loc:
        led_loc = apix_values.get(alias.upper(), None)

    if not led_loc:
        log.debug("LED alias '%s' not found", alias)
        return None, None
    else:
        return led_loc.split(",")


def play_music(play, music_file):
    """
    Sets the play music value.

    Args:
        play (Boolean): `True` to play music, `False` to stop it.
        music_file (String): Path of the music file to play.
    """
    exec_cmd("pkill -KILL -f mpg123")
    if play:
        exec_cmd_nowait(f"mpg123 {music_file}")


def set_audio_volume(value):
    """
    Configures the audio volume.

    Args:
        value (Integer): Volume to set in percentage.

    Returns:
        String: Error string if fails.
    """
    res = exec_cmd(f"amixer set 'Speaker' {value}% && amixer set 'Headphone' {value}%")
    if res[0] != 0:
        return res[1]
    return None


def get_elements_configuration(elements):
    """
    Gets the configuration for the given elements.

    Args:
        elements (List): Elements for which to get the configuration.

    Returns:
        Dictionary: The elements configuration data.
    """
    data = {}
    for element in elements:
        if element == ELEMENT_BLUETOOTH:
            data[element] = get_bluetooth_element_configuration()
        elif element in (ELEMENT_ETHERNET, ELEMENT_WIFI):
            data[element] = get_network_element_configuration(element)
        else:
            data["error"] = f"Unknown element '{element}'"

    return data


def get_network_element_configuration(element):
    """
    Gets the configuration for the given network element.

    Args:
        element (String): Network element for which to get the configuration.

    Returns:
        Dictionary: The network element configuration data.
    """
    data = {}
    prefix = PREFIX_ETHERNET
    if element == ELEMENT_WIFI:
        prefix = PREFIX_WIFI
    try:
        ifaces = NetworkInterface.list_interfaces() or []
        for iface in ifaces:
            if prefix in iface:
                data[iface] = get_network_iface_configuration(iface)
    except DigiAPIXException as exc:
        data["error"] = f"Error listing network interfaces: '{str(exc)}'"

    return data


def get_network_iface_configuration(interface):
    """
    Returns the network configuration of the given interface.

    Args:
        interface (String): Network interface to get its configuration.

    Returns:
        Dictionary: dictionary with the interface configuration.
    """
    data = {}
    try:
        net_iface = NetworkInterface.get(interface)
        data["enable"] = 1 if net_iface.status == NetStatus.CONNECTED else 0
        data["mac"] = mac_to_human_string(net_iface.mac)
        data["type"] = 0 if net_iface.ip_mode == IPMode.STATIC else 1
        data["ip"] = str(net_iface.ipv4)
        data["netmask"] = str(net_iface.netmask)
        data["dns1"] = str(net_iface.dns1)
        data["dns2"] = str(net_iface.dns2)
        data["gateway"] = str(net_iface.gateway)
        if PREFIX_WIFI in interface:
            try:
                wifi_iface = WifiInterface.get(interface)
                data["ssid"] = wifi_iface.ssid
                data["frequency"] = wifi_iface.frequency
                data["channel"] = wifi_iface.channel
                data["sec_mode"] = 0 if wifi_iface.sec_mode == SecurityMode.UNKNOWN \
                    else wifi_iface.sec_mode.code
            except WifiException as exc:
                raise NetworkException({str(exc)}) from exc
    except NetworkException as exc2:
        data["error"] = f"Error reading interface data: {str(exc2)}"

    return data


def set_configuration(config_data):
    """
    Applies the given configuration.

    Args:
        config_data (Dictionary): Configuration to apply.

    Returns:
        Dictionary: The operation result.
    """
    data = {}
    for element in config_data:
        if element == ELEMENT_BLUETOOTH:
            data[element] = set_bluetooth_element_configuration(config_data[element])
        elif element in (ELEMENT_ETHERNET, ELEMENT_WIFI):
            data[element] = set_network_element_configuration(config_data[element])
        else:
            data["error"] = f"Unknown element '{element}'"

    return data


def set_network_element_configuration(config_data):
    """
    Applies the given network configuration.

    Args:
        config_data (Dictionary): Network configuration to apply.

    Returns:
        Dictionary: The operation result.
    """
    data = {}
    for iface in config_data:
        data[iface] = set_network_iface_configuration(iface, config_data[iface])

    return data


def set_network_iface_configuration(interface, config_data):
    """
    Applies the given network configuration to the given interface.

    Args:
        interface (String): Network interface to apply configuration to.
        config_data (Dictionary): Network configuration to apply.

    Returns:
        Dictionary: Operation result.
    """
    data = {}
    profile = NetworkProfile()
    if PREFIX_WIFI in interface:
        profile = WifiProfile()
    profile.connect = config_data.get("enable", None)
    profile.mode = IPMode.get(config_data["type"]) if "type" in config_data else None
    profile.ipv4 = config_data.get("ip", None)
    profile.netmask = config_data.get("netmask", None)
    profile.gateway = config_data.get("gateway", None)
    profile.dns1 = config_data.get("dns1", None)
    profile.dns2 = config_data.get("dns2", None)
    if PREFIX_WIFI in interface:
        profile.ssid = config_data.get("ssid", None)
        profile.sec_mode = (SecurityMode.get(config_data["sec_mode"])
                            if "sec_mode" in config_data else None)
        profile.psk = config_data.get("psk", None)
    try:
        if PREFIX_ETHERNET in interface:
            net_iface = NetworkInterface.get(interface)
        elif PREFIX_WIFI in interface:
            net_iface = WifiInterface.get(interface)
        else:
            raise DigiAPIXException(f"Unknown interface '{interface}'")
        net_iface.configure(profile)
        data["status"] = 0
    except DigiAPIXException as exc2:
        data["status"] = 1
        data["desc"] = f"Error configuring interface: {str(exc2)}"

    return data


def get_bluetooth_element_configuration():
    """
    Gets the configuration for the bluetooth element.

    Returns:
        Dictionary: The bluetooth element configuration data.
    """
    data = {}
    try:
        bt_devices = BluetoothDevice.list_devices() or []
        for bt_device in bt_devices:
            data[bt_device] = get_bluetooth_device_configuration(bt_device)
    except DigiAPIXException as exc:
        data["error"] = f"Error listing bluetooth devices: '{str(exc)}'"

    return data


def get_bluetooth_device_configuration(device):
    """
    Returns the configuration of the given bluetooth device.

    Args:
        device (String): Bluetooth device to get its configuration.

    Returns:
        Dictionary: dictionary with the device configuration.
    """
    data = {}
    try:
        bt_device = BluetoothDevice.get(device)
        data["device_id"] = bt_device.device_id
        data["advert_name"] = str(bt_device.advert_name)
        data["mac"] = mac_to_human_string(bt_device.mac)
        data["enable"] = 1 if bt_device.is_enabled else 0
        data["running"] = 1 if bt_device.is_running else 0
    except BluetoothException as exc:
        data["error"] = f"Error reading device data: {str(exc)}"

    return data


def set_bluetooth_element_configuration(config_data):
    """
    Applies the given bluetooth configuration.

    Args:
        config_data (Dictionary): Bluetooth configuration to apply.

    Returns:
        Dictionary: The operation result.
    """
    data = {}
    for device in config_data:
        data[device] = set_bluetooth_device_configuration(device, config_data[device])

    return data


def set_bluetooth_device_configuration(device, config_data):
    """
    Applies the given bluetooth configuration to the given device.

    Args:
        device (String): Bluetooth device to apply configuration to.
        config_data (Dictionary): Bluetooth configuration to apply.

    Returns:
        Dictionary: Operation result.
    """
    data = {}
    try:
        bt_device = BluetoothDevice.get(device)
        profile = BluetoothProfile()
        profile.enable = config_data.get("enable", None)
        profile.advert_name = config_data.get("advert_name", None)
        bt_device.configure(profile)
        data["status"] = 0
    except DigiAPIXException as exc2:
        data["status"] = 1
        data["desc"] = f"Error configuring interface: {str(exc2)}"

    return data


def mac_to_human_string(mac, num_bytes=6):
    """
    Transforms the given MAC address into a human readable string.

    Args:
        mac (:class:`.MacAddress`): The MAC address to transform.
        num_bytes (Integer): The number of bytes to use in the MAC Address.

    Return:
        String: The given MAC as human readable string.
    """
    return ":".join(["%02X" % i for i in mac][8-num_bytes:]).upper()


def read_proc_file(path):
    """
    Gets contents of a proc file.
    Reads the file and eliminates the last NULL character.

    Args:
        path (String): Absolute path of the file to read.

    Returns:
        String: The U-Boot version.
    """
    data = read_file(path)
    if data == NOT_AVAILABLE:
        return data

    if data[len(data) - 1] == '\0':
        data = data[:len(data) - 1]

    return data


def exec_cmd(cmd, timeout=None):
    """
    Executes the provided command and waits for it.

    Args:
        cmd (String, List): The command to execute.
        timeout (Float, optional, default=None): Timeout to wait for termination.

    Returns:
        Tuple (Integer, String): A tuple with the return code and the result
            output or error.
    """
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                timeout=timeout, shell=True, check=True, text=True)
        return result.returncode, result.stdout
    except subprocess.TimeoutExpired as e:
        return -1, e.stdout
    except subprocess.CalledProcessError as e:
        return e.returncode, e.stdout


def exec_cmd_nowait(command, *args):
    """
    Executes the provided command without waiting to finish.

    Args:
        command (String): The command to execute.
        args (List): The list of arguments.
    """
    arguments = []
    for arg in args:
        arguments.extend(arg)
    subprocess.Popen([command] + arguments, shell=True, stdout=subprocess.PIPE,
                     stderr=subprocess.STDOUT, text=True)


def read_file(path):
    """
    Reads the provided file path.

    Args:
        path (String): Absolute path of the file to read.

    Returns:
        String: Contents of the file, 'N/A' if any error occurs.
    """
    try:
        with open(path, encoding="utf-8") as file:
            return file.read()
    except OSError as exc:
        if exc.errno == errno.ENOENT:
            log.error("File '%s' does not exist (errno: %d)", path, exc.errno)
        else:
            log.error("Cannot open file '%s' (errno: %d)", path, exc.errno)

    return NOT_AVAILABLE


def write_file(path, value):
    """
    Writes the provided file path with the given value.

    Args:
        path (String): Absolute path of the file to write.
        value (String): Value to write.

    Returns:
        Boolean: 'True' if success, 'False' otherwise.
    """
    try:
        with open(path, 'w', encoding="utf-8") as file:
            file.write(value)
    except OSError as exc:
        log.error("Cannot write file '%s' (errno: %d)", path, exc.errno)
        return False

    return True


def resize_to(value, to, divider=1024):
    """
    Resizes the given value.

    Args:
        value (Integer): The value to resize.
        to (Integer): The divider scale.
        divider (Integer, Optional): The base divider.

    Returns:
        Float: The resized value.
    """
    r = float(value)
    return r / (divider ** DIVIDERS[to])


def init_log(log_level, log_console):
    """
    Initialize console and syslog loggers.

    Args:
        log_level (String): The file logger level.
        log_console (Boolean): `True` to log to console, `False` otherwise.
    """
    log_format = "%(name)s: %(message)s"
    level = logging.INFO
    handlers = []

    if log_level == "D":
        level = logging.DEBUG
    elif log_level == "I":
        level = logging.INFO
    elif log_level == "W":
        level = logging.WARNING
    elif log_level == "E":
        level = logging.ERROR

    def configure_handler(log_handler, name, fmt, handlers_list):
        log_handler.name = name
        log_handler.setFormatter(
            logging.Formatter(fmt=fmt, datefmt='%Y-%m-%d,%H:%M:%S'))
        log_handler.setLevel(level)
        handlers_list.append(log_handler)

    if log_console:
        log_console_format = "%(asctime)s %(name)s: %(message)s"
        configure_handler(logging.StreamHandler(), "%s console handler",
                          log_console_format, handlers)
    configure_handler(SysLogHandler(address='/dev/log'), "%s syslog handler",
                      log_format, handlers)

    log.disabled = False
    log.setLevel(level)
    for handler in handlers:
        log.addHandler(handler)


def disable_logger():
    """
    Disables the logger and removes all handlers.
    """
    log.disabled = True

    for hdl in log.handlers:
        hdl.close()
        log.removeHandler(hdl)


def signal_handler(signal_number, _frame):
    """
    Signal handler function.

    Args:
        signal_number (Integer): Received signal.
        _frame: Current stack frame.
    """
    log.debug("Signal received %d", signal_number)


def main():
    """
    Main function to listen to XBee status changes.
    """
    parser = argparse.ArgumentParser(description='Device demo server',
                                     add_help=True,
                                     formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument("-p", "--port", metavar="<port>", nargs=1, default=PORT,
                        type=int, help="Server port")
    parser.add_argument("--log", metavar="<D, I, W, E>", default='I',
                        choices=['D', 'I', 'W', 'E'],
                        help="Log level: debug, info, warning, error")
    parser.add_argument("--log-console", action='store_true',
                        dest="log_console",
                        help="Enable log to standard output")

    args = parser.parse_args()

    init_log(args.log, args.log_console)

    # Create the HTTP server and start it.
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    server = socketserver.ThreadingTCPServer(("", args.port), RequestHandler)

    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    log.info("Serving at port %s" % args.port)

    server_thread = Thread(target=server.serve_forever)
    server_thread.deamon = True
    server_thread.start()

    bt_service = BluetoothService()
    bt_service.start()

    # Wait for termination/interrupt signal.
    signal.sigwait([signal.SIGTERM, signal.SIGINT])

    bt_service.stop()
    server.shutdown()
    server.server_close()
    log.info("Sever stopped")
    disable_logger()


if __name__ == "__main__":
    main()
