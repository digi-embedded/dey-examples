# ***************************************************************************
# Copyright (c) 2017 Digi International Inc.
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this file,
# You can obtain one at http://mozilla.org/MPL/2.0/.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
# REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
# AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
# INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
# LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
# OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
# PERFORMANCE OF THIS SOFTWARE.
#
# Digi International Inc. 11001 Bren Road East, Minnetonka, MN 55343
#
# ***************************************************************************
EXECUTABLE = awsiot-sample

SRC = src

CFLAGS += -Wall
CFLAGS += $(LOG_FLAGS)
CFLAGS += -DGIT_REVISION=\"$(if $(GIT_REVISION),-g$(GIT_REVISION))\"

CFLAGS += $(shell pkg-config --cflags awsiotsdk)
LDLIBS += $(shell pkg-config --libs --static awsiotsdk)

SRCS = $(wildcard $(SRC)/*.c)
OBJS = $(SRCS:.c=.o)

.PHONY: all
all:  $(EXECUTABLE)

$(EXECUTABLE): $(OBJS)
	$(CC) $(LDFLAGS) $^ $(LDLIBS) -o $@

.PHONY: install
install: $(EXECUTABLE)
	install -d $(DESTDIR)/usr/bin
	install -m 0755 $(EXECUTABLE) $(DESTDIR)/usr/bin/
	install -d $(DESTDIR)/etc
	install -m 0644 cfg_files/*.conf $(DESTDIR)/etc/

.PHONY: clean
clean:
	-rm -f $(EXECUTABLE) $(OBJS)

