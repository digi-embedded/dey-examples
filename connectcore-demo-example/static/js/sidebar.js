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

// Hide submenus
$("#body-row .collapse").collapse("hide");

// Collapse/Expand icon.
$("#collapse-icon").addClass("fa-angle-double-left");

// Select click.
$("#sections > a").click(function() {
    selectSection($(this));
});

// Collapse click.
$("[data-toggle=sidebar-collapse]").click(function() {
    sidebarCollapse();
});

$(".element-grayed").click(function(){return false;});

// Selects the given item in the sidebar.
function selectSection(selectedItem) {
    // Remove decorations of previously selected element.
    $("#sections .selected").removeClass(CLASS_SELECTED);

    // Decorate the selected element.
    selectedItem.toggleClass(CLASS_SELECTED);
}

// Collapses the sidebar to the left.
function sidebarCollapse() {
    $(".menu-collapsed").toggleClass("d-none");
    $(".sidebar-submenu").toggleClass("d-none");
    $(".submenu-icon").toggleClass("d-none");

    // Add/Remove right margin.
    $(".digi-menu-icon").toggleClass("mr-3 mr-0");

    $("#sidebar-container").toggleClass("sidebar-expanded sidebar-collapsed");

    // Treating d-flex/d-none on separators with title.
    var separatorTitle = $(".sidebar-separator-title");
    if (separatorTitle.hasClass("d-flex"))
        separatorTitle.removeClass("d-flex");
    else
        separatorTitle.addClass("d-flex");

    // Collapse/Expand icon.
    $("#collapse-icon").toggleClass("fa-angle-double-left fa-angle-double-right");

    // Make the cards the same height. Wait some time so size is
    // calculated after the content of the cards expands or collapses.
    window.setTimeout(function () {
        $(".adjust-card-height .card").matchHeight();
    }, 100);

    if (isDashboardShowing()) {
        let refreshPanelsInterval = window.setInterval(adjustImageSize, 10);
        window.setTimeout(function () {
           window.clearInterval(refreshPanelsInterval);
        }, 300);
    }
}

// Sets the selected section.
function setSelectedSection(element=null) {
    // First, unselect all the sections.
    $("#sections li").each(function(i, n) {
        n.children[0].classList.remove(CLASS_SELECTED);
    });
    // Select the corresponding section.
    if (element != null) {
        element.classList.add(CLASS_SELECTED);
    } else {
        $("#sections li").each(function(i, n) {
            if (window.location.pathname == n.children[0].pathname) {
                n.children[0].classList.add(CLASS_SELECTED);
                return false;
            }
        });
    }
}

