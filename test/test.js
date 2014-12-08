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
      expect(loggerOutput.join('\n')).to.not.match(/error/);
    });
  });

  it('should create an error string when there are errors', function() {
    var sourcePath = 'test/fixtures/css-file-that-uses-important';
    chdir(sourcePath);

    var tree = cssLint('.', {
      logError: function(message) { loggerOutput.push(message) }
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function() {
      expect(loggerOutput.join('\n')).to.match(/error/);
      expect(loggerOutput.join('\n')).to.match(/important/);
    });
  });

  it('should pluralize the error string when there are multiple errors', function() {
    var sourcePath = 'test/fixtures/css-file-with-multiple-errors';
    chdir(sourcePath);

    var tree = cssLint('.', {
      logError: function(message) { loggerOutput.push(message) }
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function() {
      expect(loggerOutput.join('\n')).to.match(/errors/);
      expect(loggerOutput.join('\n')).to.match(/empty/);
      expect(loggerOutput.join('\n')).to.match(/important/);
    });
  });

  it('uses the specified csslintrc, even if it is an ancestor directory', function() {
    var sourcePath = 'test/fixtures/css-file-that-uses-important';
    chdir(sourcePath);

    var tree = cssLint('.', {
      csslintrcRoot: '..',
      logError: function(message) { loggerOutput.push(message) }
    });

    builder = new broccoli.Builder(tree);
    return builder.build().then(function() {
      expect(loggerOutput.join('\n')).to.not.match(/error/);
    });
  });
});
