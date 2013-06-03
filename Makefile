TESTS = $(shell ls -S `find test -type f -name "*.js" -print`)
TIMEOUT = 5000
MOCHA_OPTS =
REPORTER = tap
NPM_INSTALL_PRODUCTION = PYTHON=`which python2.6` NODE_ENV=production npm install
NPM_INSTALL_TEST = PYTHON=`which python2.6` NODE_ENV=test npm install

install:
	@$(NPM_INSTALL_PRODUCTION)

test:
	@$(MAKE) install
	@$(NPM_INSTALL_TEST)
	@NODE_ENV=test node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TIMEOUT) $(MOCHA_OPTS) $(TESTS)

test-dot:
	@$(MAKE) test REPORTER=dot

test-cov: install
	@rm -f coverage.html
	@$(MAKE) test  MOCHA_OPTS='--require blanket' REPORTER=html-cov > coverage.html
	@$(MAKE) test  MOCHA_OPTS='--require blanket' REPORTER=travis-cov
	@ls -lh coverage.html

test-all: test test-cov

clean:
	@rm -f coverage.html

.PHONY: install test test-cov test-dot clean

