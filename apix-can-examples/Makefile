#
# Copyright 2017, Digi International Inc.
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
#

BINARYTX := apix-can-send-example
BINARYRX := apix-can-recv-example

BINARIES := $(BINARYTX) $(BINARYRX)

CFLAGS += -Wall -O0

CFLAGS += $(shell pkg-config --cflags libdigiapix)
LDLIBS += $(shell pkg-config --libs libdigiapix)

.PHONY: all
all: $(BINARIES)

$(BINARYTX): can-send-example.o
	$(CC) $(LDFLAGS) $^ $(LDLIBS) -o $(BINARYTX)

$(BINARYRX): can-recv-example.o
	$(CC) $(LDFLAGS) $^ $(LDLIBS) -o $(BINARYRX)

.PHONY: install
install: $(BINARIES)
	install -d $(DESTDIR)/usr/bin
	install -m 0755 $^ $(DESTDIR)/usr/bin/

.PHONY: clean
clean:
	-rm -f *.o $(BINARIES)
