// https://gist.github.com/ne-sachirou/0d7da119dd4a8a323842
(function (global) {
'use strict';

class Evaluator {
  constructor(patterns) {
    this.patterns = patterns;
    this._init();
  }

  evaluate(format, values) {
    this._init();
    var result = '';
    const formatLength = format.length;
    while (this._indexOfFormat < formatLength) {
      for (let e of this.patterns) {
        let pattern  = e[0];
        let callback = e[1];
        pattern.lastIndex = this._indexOfFormat;
        let match = pattern.exec(format);
        if (match && match.index === this._indexOfFormat) {
          result += callback.call(this, match, values);
          this._indexOfFormat += match[0].length;
        }
      }
    }
    return result;
  }

  _init() {
    this._indexOfFormat = 0;
  }
}

class SprintfEvaluator extends Evaluator {
  _init() {
    super._init();
    this._indexOfValues = 0;
  }
}

var sprintfEvaluator = new SprintfEvaluator(
  [
    [
      /[^%]+/g,
      (match) => match[0],
    ],
    [
      /%([-#0 +'l]*)(\d*)(\.\d*)?(hh|h|l|ll|L|j|z|t)?([diouxXeEfFgGaAcspnm%])/g,
      function (match, values) {
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
              let value = values[this._indexOfValues];
              ++this._indexOfValues;
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
              return resultLeftSpace + resultSign + resultLeft0 + resultBody + resultRight;
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
              let resultBody  = values[this._indexOfValues].toString();
              let resultRight = '';
              ++this._indexOfValues;
              if (isFlag0 || isFlagSpace) {
                if (isFlagLeft && fieldWidth > resultBody.length) {
                  resultRight = ' '.repeat(fieldWidth - resultBody.length);
                } else {
                  resultLeft = ' '.repeat(fieldWidth - resultBody.length);
                }
              }
              return resultLeft + resultBody + resultRight;
            }
          case 'p':
            break;
          case 'n':
            break;
          case 'm':
            break;
          case '%':
            return '%';
          default:
            throw new Error('NotImplemented');
        }
      }
    ],
  ]
);

function sprintf(format, ...values) {
  return sprintfEvaluator.evaluate(format, values);
}

var strftimeEvaluator = new Evaluator(
  [
    [
      /[^%]+/g,
      (match) => match[0]
    ],
    [
      /%([aAbBcCdDeEFGghHIJklmMnOpPrRsStTuUVwWxXyYzZ+%])/g,
      function (match, date) {
        date = date[0];
        switch (match[1]) {
          default:
            throw new Error('NotImplemented');
        }
      }
    ],
  ]
);

function strftime(format, date) {
  return strftimeEvaluator.evaluate(format, [date]);
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
