# ***************************************************************************
# Copyright (c) 2017 Digi International Inc.
#
# Permission to use, copy, modify, and/or distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
# REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
# AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
# INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
# LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
# OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
# PERFORMANCE OF THIS SOFTWARE.
#
# ***************************************************************************
EXECUTABLE = awsiot-sample

SRC = src

CFLAGS += -Wall
CFLAGS += $(LOG_FLAGS)
CFLAGS += -DGIT_REVISION=\"$(if $(GIT_REVISION),-g$(GIT_REVISION))\"

CFLAGS += $(shell pkg-config --cflags awsiotsdk)
CFLAGS += $(shell pkg-config --cflags libconfuse)
LDLIBS += $(shell pkg-config --libs --static awsiotsdk)
LDLIBS += $(shell pkg-config --libs --static libconfuse)

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

