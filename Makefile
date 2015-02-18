#bins
JSX=jsx
BROWSERIFY=node_modules/browserify/bin/cmd.js

#dependencies
SRC_JS_COMPONENTS=$(shell find src/js/components)
SRC_JS_LIB=$(shell find src/js/lib)

all: build/public/js/main.js \
	archive.zip

build/public/js/main.js: src/js/main.js build/.components $(SRC_JS_LIB)
	$(BROWSERIFY) --debug $< > $@

build/.components: $(SRC_JS_COMPONENTS)
	mkdir -p build/public/js/components
	$(JSX) --extension=jsx src/js/components build/public/js/components
	touch $@

archive.zip: *
	zip -r archive.zip *

clean:
	rm -f archive.zip
	rm -f logs/*/*.sgm
	rm -rf build

.PHONY: clean components