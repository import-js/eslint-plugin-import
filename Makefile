SRC = $(wildcard src/*.js) $(wildcard src/**/*.js)
LIB = $(SRC:src/%=lib/%)
BABEL = node_modules/.bin/babel
MOCHA = node_modules/.bin/mocha

default: $(LIB)

lib/%.js: src/%.js
	@mkdir -p "$(@D)"
	$(BABEL) $< > $@

tests/lib/%.js: tests/src/%.js
	@mkdir -p "$(@D)"
	$(BABEL) $< > $@

clean:
	rm -rf lib
	rm -rf tests/lib

TEST_SRC = $(wildcard tests/src/*.js) $(wildcard tests/src/**/*.js)
TEST_LIB = $(TEST_SRC:tests/src/%=tests/lib/%)

test: $(LIB) $(TEST_LIB)
	NODE_PATH=./lib $(MOCHA) --recursive --reporter dot tests/lib/

.PHONY: clean test