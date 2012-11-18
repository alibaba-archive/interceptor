TESTS = $(shell ls -S `find test -type f -name "*.js" -print`)
TIMEOUT = 5000
MOCHA_OPTS =
REPORTER = tap
JSCOVERAGE = ./node_modules/.bin/jscover
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

lib-cov:
	@rm -rf $@
	@$(JSCOVERAGE) lib $@

test-cov: lib-cov
	@INTERCEPTOR_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

clean:
	@rm -f coverage.html

.PHONY: install test test-cov cov test-dot clean

