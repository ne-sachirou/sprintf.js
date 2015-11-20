(function (global) {
  'use strict';

  class Formatter {
    constructor(format, values) {
      this._format        = format;
      this._values        = values;
      this._result        = "";
      this._indexOfFormat = 0;
      this._indexOfValues = 0;
    }

    format() {
      while (this._indexOfFormat < this._format.length) {
        for (let e of Formatter.PATTERNS) {
          let pattern  = e[0];
          let callback = e[1];
          pattern.lastIndex = this._indexOfFormat;
          let match;
          if (match = pattern.exec(format)) {
            callback(this, match);
            this._indexOfFormat += match[0].length;
            break;
          }
        }
      }
      return this._result;
    }
  }

  Formatter.PATTERNS = [
    [
      /[^%]+/,
      function (formatter, match) {
        formatter._result += match[0];
      }
    ],
    [
      /%([#0- +'l]*)(\d*)(\.\d*)?(hh|h|l|ll|L|j|z|t)?([diouxXeEfFgGaAcspnm%])/,
      // http://linuxjm.osdn.jp/html/LDP_man-pages/man3/printf.3.html
      function (formatter, match) {
        var flags               = match[1];
        var fieldWidth          = match[2];
        var precision           = match[3];
        var lengthModifier      = match[4];
        var conversionSpecifier = match[5];
        switch (conversionSpecifier) {
          case 'd': case 'i':
            let value = parseInt(formatter._values[formatter._indexOfValues]);
            formatter._result += value;
            ++formatter._indexOfValues;
            break;
          case 's':
            let value = formatter._values[formatter._indexOfValues].toString();
            formatter._result += value;
            ++formatter._indexOfFormat;
            break;
          case '%':
            formatter._result += '%';
            break;
          default:
            throw new Error('NotImplemented');
        }
      }
    ],
  ];


  function sprintf(format/*, ...values*/) {
    var values = arguments.slice(1);
    return new Formatter(format, values).format();
  }

  global.sprintf = sprintf;
}((module && module.exports) || this));
