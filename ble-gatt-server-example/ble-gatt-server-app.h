/*
 *  BlueZ - Bluetooth protocol stack for Linux
 *
 *  Copyright (C) 2014  Google Inc.
 *  Copyright (C) 2019  Digi International Inc.
 *
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 */

/*
 * A full list of officially adopted BLE services can be seen on
 * https://www.bluetooth.com/specifications/gatt/services/
 */
#define UUID_GAP_SERVICE			0x1800 /* Generic Access Service (GAP) */
#define UUID_GATT_SERVICE			0x1801 /* Generic Attribute Profile Service (GATT) */
#define UUID_DEVICE_INFORMATION_SERVICE		0x180A /* Device Information Service */

/*
 * See BT specification to list all official characteristics UUID
 * from https://www.bluetooth.com/specifications/gatt/characteristics/
 */
#define UUID_GATT_CHARACTERISTIC_CURRENT_TIME			0x2A2B
#define UUID_GATT_CHARACTERISTIC_TEMPERATURE_MEASUREMENT	0x2A1C

/*
 * See BT specification to list all GATT Bluetooth Format types
 * from https://www.bluetooth.com/specifications/assigned-numbers/format-types/
 */
#define BLE_GATT_CPF_FORMAT_UINT8 		0x04 /* Unsigned 8-bit integer */
#define BLE_GATT_CPF_FORMAT_UTF8S 		0x19 /* UTF-8 string */

/*
 * See BT specification to list all GATT Bluetooth Units
 * from https://www.bluetooth.com/specifications/assigned-numbers/units/
 */
#define BLE_GATT_CPF_UNIT_DEGREE_CELSIUS 	0x27,0x2F /* Celsius temperature (degree Celsius) */
#define BLE_GATT_CPF_UNIT_TIME_SECONDS 		0x27,0x03 /* Time (second) */

/*
 * See BT specification to list all GATT Bluetooth Namespace Descriptions
 * from https://www.bluetooth.com/specifications/assigned-numbers/gatt-namespace-descriptors/
 */
#define BLE_GATT_SIG_NAMESPACE 0x01
#define BLE_GATT_SIG_DESCRIPTOR_UNKNOWN 0x00,0x00
#define BLE_GATT_SIG_DESCRIPTOR_INTERNAL 0x01,0x0F

/*
 * See BT specification 4.2, section 3.3.3.5
 * for Characteristic Presentation Format descriptor:
 * - Format (1 octet)
 * - Exponent (1 octet)
 * - Unit (2 octet)
 * - Name Space (1 octet)
 * - Description (2 octet)
 */
#define FORMAT_BYTES	7

const uint8_t FORMAT_8_BIT_INT[] = {
	BLE_GATT_CPF_FORMAT_UINT8,
	0x00,
	BLE_GATT_CPF_UNIT_DEGREE_CELSIUS,
	BLE_GATT_SIG_NAMESPACE,
	BLE_GATT_SIG_DESCRIPTOR_INTERNAL
};

const uint8_t FORMAT_UTF_8[] = {
	BLE_GATT_CPF_FORMAT_UTF8S,
	0x00,
	BLE_GATT_CPF_UNIT_TIME_SECONDS,
	BLE_GATT_SIG_NAMESPACE,
	BLE_GATT_SIG_DESCRIPTOR_UNKNOWN
};
