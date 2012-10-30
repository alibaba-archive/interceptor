NAME = interceptor 
TESTS = $(shell ls -S `find test -type f -name "*.js" -print`)
TIMEOUT = 5000
MOCHA_OPTS =
REPORTER = tap
VERSION = $(shell date +%Y%m%d%H%M%S)
JSCOVERAGE = ./node_modules/visionmedia-jscoverage/jscoverage
PROJECT_DIR = $(shell pwd)
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

cov:
	@rm -rf ../interceptor-cov
	@$(JSCOVERAGE) --encoding=utf-8 --exclude=node_modules --exclude=test --exclude=README.md --exclude=Makefile\
		./ ../interceptor-cov 
	@cp -rf ./node_modules Makefile ./test ../interceptor-cov

test-cov: cov
	@$(MAKE) -C $(PROJECT_DIR)/../interceptor-cov test REPORTER=min
	@$(MAKE) -C $(PROJECT_DIR)/../interceptor-cov test REPORTER=html-cov > $(PROJECT_DIR)/coverage.html

clean:
	@rm -f coverage.html

.PHONY: install test test-cov cov test-dot clean

