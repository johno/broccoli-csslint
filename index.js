// Adapted from https://github.com/rwjblue/broccoli-jshint/blob/master/index.js

'use strict';

var csslint = require('csslint').CSSLint;
var Filter = require('broccoli-filter');
var path = require('path');
var chalk = require('chalk');
var fs = require('fs');
var findup = require('findup-sync');
var mkdirp = require('mkdirp');

CSSLinter.prototype = Object.create(Filter.prototype);
CSSLinter.prototype.constructor = CSSLinter;

function CSSLinter(inputTree, options) {
  if (!(this instanceof CSSLinter)) {
    return new CSSLinter(inputTree, options);
  }

  options = options || {};

  this.inputTree = inputTree;
  this.log = true;

  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key]
    }
  }
};

CSSLinter.prototype.extensions = ['css'];

CSSLinter.prototype.write = function (readTree, destDir) {
  var self = this
  self._errors = [];

  return readTree(this.inputTree).then(function (srcDir) {
    if (!self.csslintrc) {
      var csslintrcPath = self.csslintrcPath || path.join(srcDir, self.csslintrcRoot || '');
      self.csslintrc = self.getConfig(csslintrcPath);
    }

    return Filter.prototype.write.call(self, readTree, destDir)
  })
  .finally(function() {
    if (self._errors.length > 0) {
      var label = ' CSSLint Error' + (self._errors.length > 1 ? 's' : '')
      console.log('\n' + self._errors.join('\n'));
      console.log(chalk.yellow('===== ' + self._errors.length + label + '\n'));
    }
  });
}

CSSLinter.prototype.processString = function (content, relativePath) {
  var report = csslint.verify(content, this.csslintrc);
  var errors = this.processMessages(relativePath, report.messages);

  if (report.messages.length > 0) {
    this.logError(errors);
  }
};

CSSLinter.prototype.processMessages = function (file, messages) {
  var len = messages.length

  if (len == 0) {
    return '';
  }

  var messageStr = messages.map(function(message, i) {
    return file + ': line ' + message.line + ', col ' + message.col + ', ' + message.message;
  }).join();

  return messageStr + '\n' + len + ' error' + ((len === 1) ? '' : 's');
}

CSSLinter.prototype.logError = function(message, color) {
  color = color || 'red';

  this._errors.push(chalk[color](message) + "\n");
};

CSSLinter.prototype.getConfig = function(rootPath) {
  if (!rootPath) { rootPath = process.cwd(); }

  var ruleset = {};
  var lintOptions = {};

  var csslintrc = findup('.csslintrc', { cwd: rootPath, nocase: true });

  if (csslintrc) {
    var config = fs.readFileSync(csslintrc, { encoding: 'utf8' });

    try {
      lintOptions = JSON.parse(this.stripComments(config));
    } catch (e) {
      console.error(chalk.red('Error occured parsing .csslintrc.'));
      console.error(e.stack);

      return null;
    }
  }

  // Build a list of all available rules
  csslint.getRules().forEach(function(rule) {
    ruleset[rule.id] = 1;
  });

  for (var rule in lintOptions) {
    if (!lintOptions[rule]) {
      // Remove rules that are turned off
      delete ruleset[rule];
    }
    else {
      ruleset[rule] = lintOptions[rule];
    }
  }

  return ruleset;
};

CSSLinter.prototype.stripComments = function(string) {
  string = string || '';

  string = string.replace(/\/\*(?:(?!\*\/)[\s\S])*\*\//g, '');
  string = string.replace(/\/\/[^\n\r]*/g, ''); // Everything after '//'

  return string;
};

CSSLinter.prototype.escapeErrorString = function(string) {
  string = string.replace(/\n/gi, "\\n");
  string = string.replace(/'/gi, "\\'");

  return string;
};

module.exports = CSSLinter;
