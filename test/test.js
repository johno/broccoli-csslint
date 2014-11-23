// Adapted from https://github.com/rwjblue/broccoli-jshint/blob/master/tests/index.js

'use strict';

var cssLint = require('..');
var expect = require('expect.js');
var fs = require('fs');
var broccoli = require('broccoli');
var root = process.cwd();


describe('broccoli-csslint', function() {
  var loggerOutput;
  var builder;

  function readFile(path) {
    return fs.readFileSync(path, {encoding: 'utf8'});
  }

  function chdir(path) {
    process.chdir(path);
  }

  beforeEach(function() {
    chdir(root);

    loggerOutput = [];
  });

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  it('uses the csslintrc as configuration for linting', function() {
    var sourcePath = 'test/fixtures/valid-css-file';
    chdir(sourcePath);

    var tree = cssLint('.', {
      logError: function(message) { loggerOutput.push(message) }
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function() {
      console.log(loggerOutput);
      expect(loggerOutput.join('\n')).to.not.match(/Missing semicolon./)
    });
  });
});
