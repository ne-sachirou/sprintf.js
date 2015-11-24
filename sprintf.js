// https://gist.github.com/ne-sachirou/0d7da119dd4a8a323842
(function (global) {
'use strict';

class Formatter {
  _result        = "";
  _indexOfFormat = 0;
  _indexOfValues = 0;

  constructor(format, values) {
    this._format = format;
    this._values = values;
  }

  format() {
    while (this._indexOfFormat < this._format.length) {
      for (let e of Formatter.PATTERNS) {
        let pattern  = e[0];
        let callback = e[1];
        pattern.lastIndex = this._indexOfFormat;
        let match = pattern.exec(this._format);
        if (match && match.index === this._indexOfFormat) {
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
    /[^%]+/g,
    function (formatter, match) {
      formatter._result += match[0];
    }
  ],
  [
    /%([-#0 +'l]*)(\d*)(\.\d*)?(hh|h|l|ll|L|j|z|t)?([diouxXeEfFgGaAcspnm%])/g,
    function (formatter, match) {
      var flags               = match[1];
      var fieldWidth          = match[2];
      var precision           = match[3];
      var lengthModifier      = match[4];
      var conversionSpecifier = match[5];
      var isFlagSwitch = -1 !== flags.indexOf('#');
      var isFlag0      = -1 !== flags.indexOf('0');
      var isFlagLeft   = -1 !== flags.indexOf('-');
      var isFlagSpace  = -1 !== flags.indexOf(' ');
      var isFlagSign   = -1 !== flags.indexOf('+');
      var isFlagMoney  = -1 !== flags.indexOf("'");
      var isFlagLocal  = -1 !== flags.indexOf('l');
      switch (conversionSpecifier) {
        case 'd': case 'i':
          {
            if (isFlagLeft && isFlag0) {
              isFlag0 = false;
              isFlagSpace = true;
            }
            if (isFlag0) {
              isFlagSpace = false;
            }
            if (null === precision) {
              precision = 1;
            }
            let value = formatter._values[formatter._indexOfValues];
            if ('string' === typeof value || value instanceof String) {
              if (value.startsWith('0x')) {
                value = parseInt(value, 16);
              } else if ('0' === value[0]) {
                value = parseInt(value, 8);
              } else {
                value = parseInt(value, 10);
              }
            } else {
              value = ~~Number(value);
            }
            let resultLeftSpace = '';
            let resultSign      = '';
            let resultLeft0     = '';
            let resultBody      = Math.abs(value).toString();
            let resultRight     = '';
            if (value < 0 || isFlagSign) {
              resultSign = value < 0 ? '-' : '+';
            }
            let mainLength = resultSign.length + resultBody.length;
            if (isFlagSpace && fieldWidth > mainLength) {
              if (!isFlagLeft) {
                resultLeftSpace = ' '.repeat(fieldWidth - mainLength);
              } else {
                resultRight = ' '.repeat(fieldWidth - mainLength);
              }
            }
            if (isFlag0 && fieldWidth > mainLength) {
              resultLeft0 = '0'.repeat(fieldWidth - mainLength);
            }
            formatter._result += resultLeftSpace + resultSign + resultLeft0 + resultBody + resultRight;
            ++formatter._indexOfValues;
            break;
          }
        case 'o':
          break;
        case 'u':
          break;
        case 'x':
          break;
        case 'X':
          break;
        case 'e':
          break;
        case 'E':
          break;
        case 'f':
          break;
        case 'F':
          break;
        case 'g':
          break;
        case 'G':
          break;
        case 'a':
          break;
        case 'A':
          break;
        case 'c':
          break;
        case 's':
          {
            let resultLeft  = '';
            let resultBody  = formatter._values[formatter._indexOfValues].toString();
            let resultRight = '';
            if (isFlag0 || isFlagSpace) {
              if (isFlagLeft && fieldWidth > resultBody.length) {
                resultRight = ' '.repeat(fieldWidth - resultBody.length);
              } else {
                resultLeft = ' '.repeat(fieldWidth - resultBody.length);
              }
            }
            formatter._result += resultLeft + resultBody + resultRight;
            ++formatter._indexOfValues;
            break;
          }
        case 'p':
          break;
        case 'n':
          break;
        case 'm':
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


function sprintf(format, ...values) {
  return new Formatter(format, values).format();
}

function strftime(date, format) {
}

global.sprintf  = sprintf;
global.strftime = strftime;
}(/*(module && module.exports) || */(this || 0).self || global));

const DEBUG = true;
if (DEBUG) {
  var assert = require('assert');
  var cp     = require('child_process');

  // http://linuxjm.osdn.jp/html/LDP_man-pages/man3/printf.3.html
  function test(format, ...values) {
    var actual   = sprintf(format, ...values);
    var expected = cp.execSync(`printf ${[format, ...values].map((v) => `"${v}"`).join(' ')}`).toString();
    try {
      assert.strictEqual(actual, expected);
    } catch (ex) {
      console.log(Array.from(arguments));
      console.error(ex);
    }
  }

  test('string');

  test('P%dd', 3);
  test('%d', '011');
  test('%d', '0x11');
  test('%06d', 1234);
  test('% 6d', 1234);
  test('%-06d', 1234);
  test('%- 6d', 1234);
  test('%04d', -9);
  test('%+04d', 9);
  test('%+04d', -9);
  test('% 4d', -9);
  test('%+ 4d', 9);
  test('%+ 4d', -9);
  test('%-04d', -9);
  test('%-+04d', 9);
  test('%-+04d', -9);
  test('%- 4d', -9);
  test('%-+ 4d', 9);
  test('%-+ 4d', -9);

  test('a %s b', 'and');
  test('% 5s', 'ne');
  test('%05s', 'ne');
  test('%- 5s', 'ne');
  test('%-05s', 'ne');

  test('%%');
}
