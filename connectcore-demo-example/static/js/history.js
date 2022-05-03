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
const ID_CPU_CHART = "cpu-chart";
const ID_CPU_CHART_LOADING = "cpu-chart-loading";
const ID_MEMORY_CHART = "memory-chart";
const ID_MEMORY_CHART_LOADING = "memory-chart-loading";
const ID_TEMPERATURE_CHART = "temperature-chart";
const ID_TEMPERATURE_CHART_LOADING = "temperature-chart-loading";

const COLOR_CPU_CHART = "#3399FF";
const COLOR_MEMORY_CHART = "#FFD500";
const COLOR_TEMPERATURE_CHART = "#4F4F4F";

const TITLE_CPU_CHART = "CPU Usage";
const TITLE_MEMORY_CHART = "Memory Usage";
const TITLE_TEMPERATURE_CHART = "Temperature";

const UNITS_CPU_CHART = "%";
const UNITS_MEMORY_CHART = "MB";
const UNITS_TEMPERATURE_CHART = "°C";

// Variables.
var temperatureData = null;
var cpuData = null;
var memoryData = null;
var temperatureInterval = null;
var cpuInterval = null;
var memoryInterval = null;

// Initializes the charts.
function initCharts() {
    // Reset the variables.
    temperatureData = null;
    cpuData = null;
    memoryData = null;
    temperatureInterval = null;
    cpuInterval = null;
    memoryInterval = null;
    // Draw all the charts.
    drawAllCharts(true, true);
}

// Draws all the charts.
function drawAllCharts(refresh=false, showProgress=true) {
    // Sanity checks.
    if (!isHistoryShowing())
        return;
    // Draw the charts.
    drawTemperatureChart(refresh, showProgress);
    drawCPUChart(refresh, showProgress);
    drawMemoryChart(refresh, showProgress);
}

// Draws the temperature chart.
function drawTemperatureChart(refresh=false, showProgress=false) {
    if (refresh) {
        if (showProgress)
            $("#" + ID_TEMPERATURE_CHART_LOADING).show();
        $.post(
            "/ajax/history_temperature",
            JSON.stringify({
                "interval": temperatureInterval
            }),
            function(response) {
                // Process only if histograms page is showing.
                if (!isHistoryShowing())
                    return;
                // Check for errors.
                if (!checkErrorResponse(response, false)) {
                    temperatureData = response.data;
                    drawTemperatureChart();
                    $("#" + ID_TEMPERATURE_CHART_LOADING).hide();
                }
            }
        ).fail(function(response) {
            // Process only if histograms page is showing.
            if (!isHistoryShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
        });
    } else {
        drawChart(ID_TEMPERATURE_CHART, temperatureData, TITLE_TEMPERATURE_CHART, UNITS_TEMPERATURE_CHART, COLOR_TEMPERATURE_CHART);
    }
}

// Draws the CPU chart.
function drawCPUChart(refresh=false, showProgress=false) {
    if (refresh) {
        if (showProgress)
            $("#" + ID_CPU_CHART_LOADING).show();
        $.post(
            "/ajax/history_cpu",
            JSON.stringify({
                "interval": cpuInterval
            }),
            function(response) {
                // Process only if histograms page is showing.
                if (!isHistoryShowing())
                    return;
                // Check for errors.
                if (!checkErrorResponse(response, false)) {
                    cpuData = response.data;
                    drawCPUChart();
                    $("#" + ID_CPU_CHART_LOADING).hide();
                }
            }
        ).fail(function(response) {
            // Process only if histograms page is showing.
            if (!isHistoryShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
        });
    } else {
        drawChart(ID_CPU_CHART, cpuData, TITLE_CPU_CHART, UNITS_CPU_CHART, COLOR_CPU_CHART);
    }
}

// Draws the memory chart.
function drawMemoryChart(refresh=false, showProgress=false) {
    if (refresh) {
        if (showProgress)
            $("#" + ID_MEMORY_CHART_LOADING).show();
        $.post(
            "/ajax/history_memory",
            JSON.stringify({
                "interval": memoryInterval
            }),
            function(response) {
                // Process only if histograms page is showing.
                if (!isHistoryShowing())
                    return;
                // Check for errors.
                if (!checkErrorResponse(response, false)) {
                    memoryData = response.data;
                    drawMemoryChart();
                    $("#" + ID_MEMORY_CHART_LOADING).hide();
                }
            }
        ).fail(function(response) {
            // Process only if histograms page is showing.
            if (!isHistoryShowing())
                return;
            // Process error.
            processAjaxErrorResponse(response);
        });
    } else {
        drawChart(ID_MEMORY_CHART, memoryData, TITLE_MEMORY_CHART, UNITS_MEMORY_CHART, COLOR_MEMORY_CHART);
    }
}

// Draws the chart with the given data.
function drawChart(id, data, title, units, color=null) {
    // Sanity checks.
    if (!isHistoryShowing())
        return;
    // Create the chart table.
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("date", "");
    dataTable.addColumn("number", "");
    // Check if any data was given.
    if (data.length == 0) {
        $("#" + id).empty();
        $("#" + id).append("<span class='no-data-label'>Not enough data</span>");
        return;
    }
    // Add the data rows.
    dataTable.addRows(data.length);
    // Fill each row with the given data.
    $.each(data, function(k, v) {
        dataTable.setCell(k, 0, new Date(v[ID_TIMESTAMP]));
        dataTable.setCell(k, 1, v[ID_DATA]);
    });
    // Build chart options.
    var options = {
        backgroundColor: "transparent",
        series: {
            0: {
                axis: "Data",
                color: color,
                visibleInLegend: false
            }
        },
        axes: {
            y: {
                Data: {
                    label: units
                }
            }
        },
        legend: {
            position: "none"
        },
        vAxis: {
            viewWindow: {
                min: 0
            }
        }
    };
    // Create the chart.
    var chart = new google.charts.Line(document.getElementById(id));
    // Draw the chart.
    chart.draw(dataTable, google.charts.Line.convertOptions(options));
}

