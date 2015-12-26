SRC = $(wildcard src/*.js) $(wildcard src/**/*.js)
LIB = $(SRC:src/%=lib/%)
EXISTING = $(wildcard lib/*.js) $(wildcard lib/**/*.js)
EXTRAS = $(filter-out $(LIB),$(EXISTING))
BABEL = node_modules/.bin/babel
MOCHA = node_modules/.bin/mocha

default: $(LIB) | clean-extras

clean-extras:
	@rm -f $(EXTRAS)

# todo: combine these, somehow
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

test: $(LIB) $(TEST_LIB) | clean-extras
	NODE_PATH=./lib $(MOCHA) --recursive --reporter dot tests/lib/

.PHONY: clean test clean-extras