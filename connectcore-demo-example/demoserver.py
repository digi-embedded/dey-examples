#!/usr/bin/python3

# Copyright (c) 2022, Digi International, Inc.
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
import http.server
import json
import logging
import os
import platform
import re
import signal
import socketserver
import stat
import subprocess

from logging.handlers import SysLogHandler
from subprocess import call, TimeoutExpired
from threading import Thread, Event


# Constants.
APP_NAME = "Demo server"

PORT = 9090

SIZE_KB = "KB"
SIZE_MB = "MB"
SIZE_GB = "GB"

DIVIDERS = {SIZE_KB : 1, SIZE_MB: 2, SIZE_GB: 3}

ZERO_MAC = "00:00:00:00:00:00"
ZERO_IP = "0.0.0.0"
NOT_AVAILABLE = "N/A"

# Variables.
log = logging.getLogger(APP_NAME)
stop_event = Event()
last_cpu_work = 0
last_cpu_total = 0


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
        # Forbidden.
        self._set_headers(403)

    def do_POST(self):
        """
        Override.
        """
        if re.search("/ajax/get_device_info", self.path) is not None:
            # Set the response headers.
            self._set_headers(200)

            log.debug("Get device info")

            # Generate the JSON information.
            mem_info = get_mem_info()
            mca_versions = get_mca_version()
            info = {
                "uboot_version": read_proc_file("/proc/device-tree/digi,uboot,version"),
                "kernel_version": "%s %s %s %s %s GNU/Linux" % (platform.system(), platform.node(), platform.release(), platform.version(), platform.machine()),
                "dey_version": "DEY-%s-%s" % (get_dey_version(), read_file("/etc/version")),
                "serial_number": read_proc_file("/proc/device-tree/digi,hwid,sn"),
                "device_type": read_proc_file("/proc/device-tree/digi,machine,name"),
                "module_variant": read_proc_file("/proc/device-tree/digi,hwid,variant"),
                "board_variant": read_proc_file("/proc/device-tree/digi,carrierboard,version"),
                "board_id": read_proc_file("/proc/device-tree/digi,carrierboard,id"),
                "mca_hw_version": mca_versions[1],
                "mca_fw_version": mca_versions[0],
                "memory_total": mem_info.get("MemTotal", NOT_AVAILABLE) if mem_info else NOT_AVAILABLE,
                "flash_size": get_storage_size(),
                "bluetooth_mac": get_bt_mac("hci0"),
                "wifi_mac": read_file("/sys/class/net/wlan0/address").strip().upper() if "wlan0" in list_net_ifaces() else ZERO_MAC,
                "wifi_ip": get_iface_ip("wlan0") if "wlan0" in list_net_ifaces() else ZERO_IP,
                "ethernet_mac": read_file("/sys/class/net/eth0/address").strip().upper() if "eth0" in list_net_ifaces() else ZERO_MAC,
                "ethernet_ip": get_iface_ip("eth0") if "eth0" in list_net_ifaces() else ZERO_IP,
            }

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
            bt_data = get_bt_data("hci0")
            status = {
                "system_monitor/cpu_load": get_cpu_load(),
                "system_monitor/cpu_temperature": get_cpu_temp(),
                "system_monitor/frequency": read_file("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_cur_freq").strip(),
                "system_monitor/uptime": get_uptime(),
                "system_monitor/free_memory": mem_free,
                "system_monitor/used_memory": mem_used,
                "system_monitor/hci0/state": bt_data.get("state", 0),
                "system_monitor/hci0/rx_bytes": bt_data.get("rx_bytes", 0),
                "system_monitor/hci0/tx_bytes": bt_data.get("tx_bytes", 0),
            }

            list_ifaces = list_net_ifaces()
            for name in list_ifaces:
                data = get_iface_data(name)
                status["system_monitor/%s/state" % name] = data["state"]
                status["system_monitor/%s/rx_bytes" % name] = data["rx_bytes"]
                status["system_monitor/%s/tx_bytes" % name] = data["tx_bytes"]

            # Send the JSON value.
            self.wfile.write(json.dumps(status).encode(encoding="utf_8"))
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
    size = read_file("/sys/class/mmc_host/mmc0/mmc0:0001/block/mmcblk0/size")
    if size == NOT_AVAILABLE:
        return -1
    try:
        return int(resize_to(int(size) * 512, SIZE_KB))
    except ValueError:
        return -1


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


def list_net_ifaces():
    """
    Returs a list with the names of the network interfaces.

    Returns:
       List: List of network inteface names.
    """
    return os.listdir("/sys/class/net")


def get_iface_ip(iface_name):
    """
    Gets the IP address of the provided interface.

    Args:
        iface_name (String): Name of the network interface to get its IP.

    Returns:
        String: The IP of the interface.
    """
    res = exec_cmd("ip addr show %s" % iface_name)
    if res[0] == 0:
        tmp = res[1].split("inet ")
        if len(tmp) > 1:
            return tmp[1].split("/")[0]

    log.error("Error getting IP of interface '%s': %s", iface_name, res[1])

    return ZERO_IP


def get_iface_data(iface_name):
    """
    Gets network interface state and statistics.

    Args:
        iface_name (String): Name of the interface to get data.

    Returns:
        Dictionary: The network interface state and statistics.
    """
    data = {
        "state": 0,
        "rx_bytes": 0,
        "tx_bytes": 0
    }
    state = read_file("/sys/class/net/%s/operstate" % iface_name)
    if state != NOT_AVAILABLE:
        data["state"] = 1 if state.strip() == "up" else 0

    stats = read_file("/proc/net/dev")
    if stats == NOT_AVAILABLE:
        return data

    for line in stats.splitlines():
         if not line.strip().startswith("%s: " % iface_name):
             continue
         fields = line.split()
         data["rx_bytes"] = fields[1]
         data["tx_bytes"] = fields[9]
         break

    return data


def is_bt_available():
    """
    Checks if Bluetooth is available on the device.

    Returns:
        Boolean: True if available, False otherwise.
    """
    return os.path.isdir("/proc/device-tree/bluetooth")


def get_bt_mac(iface_name):
    """
    Gets Bluetooth MAC address.

    Args:
        iface_name (String): Name of the interface to get the MAC.

    Returns:
        String: The Bluetooth MAC.
    """
    if not is_bt_available():
        return ZERO_MAC

    res = exec_cmd("hciconfig %s" % iface_name)
    if res[0] == 0:
        return res[1].split("BD Address:")[1].split("ACL")[0].strip()
    else:
        log.error("Error getting MAC of Bluetooth interface '%s': %s", iface_name, res[1])
        return ZERO_MAC


def get_bt_data(iface_name):
    """
    Gets Bluetooth interface state and statistics.

    Args:
        iface_name (String): Name of the interface to get data.

    Returns:
        Dictionary: The Bluetooth interface state and statistics.
    """
    data = {
        "state": 0,
        "rx_bytes": 0,
        "tx_bytes": 0
    }

    if not is_bt_available():
        return data

    res = exec_cmd("hciconfig %s" % iface_name)
    if res[0] == 0:
        info = res[1]
    else:
        log.error("Error getting status of Bluetooth interface '%s': %s", iface_name, res[1])
        return data

    lines = info.splitlines()
    if not lines:
        return data

    if len(lines) > 2 and re.fullmatch("(UP) .*", lines[2].strip()):
        data["state"] = 1

    if len(lines) > 3:
        m = re.fullmatch("RX bytes:([0-9]+) .*", lines[3].strip())
        data["rx_bytes"] = m.group(1) if m else 0

    if len(lines) > 4:
        m = re.fullmatch("TX bytes:([0-9]+) .*", lines[4].strip())
        data["tx_bytes"] = m.group(1) if m else 0

    return data


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


def read_file(path):
    """
    Reads the provided file path.

    Args:
        path (String): Absolute path of the file to read.

    Returns:
        String: Contents of the file, 'N/A' if any error occurs.
    """
    try:
        with open(path) as f:
            return f.read()
    except OSError as e:
        if e.errno == errno.ENOENT:
            log.error("File '%s' does not exist (errno: %d)", path, e.errno)
        else:
            log.error("Cannot open file '%s' (errno: %d)", path, e.errno)

    return NOT_AVAILABLE


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
    if signal_number in (signal.SIGTERM, signal.SIGINT):
        stop_event.set()


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

    stop_event.wait()

    server.shutdown()
    server.server_close()
    log.info("Sever stopped")
    disable_logger()


if __name__ == "__main__":
    main()

