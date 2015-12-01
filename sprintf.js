// vim:set fdm=marker:
// https://gist.github.com/ne-sachirou/0d7da119dd4a8a323842
(function (global) {
'use strict';

class Evaluator {
  patterns = [];

  constructor() {
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

// {{{ !sprintf
class SprintfEvaluator extends Evaluator {
  patterns = [
    [
      /[^%]+/g,
      (match) => match[0],
    ],
    [
      /%([-#0 +'l]+)?(\d+)?(\.\d*)?(hh|h|l|ll|L|j|z|t)?([diouxXeEfFgGaAcspnm%])/g,
      function (match, values) {
        var flags               = match[1] || '';
        var fieldWidth          = match[2] ? parseInt(match[2], 10) : 0;
        var precision           = match[3] ? parseInt(match[3].slice(1), 10) : null;
        var lengthModifier      = match[4];
        var conversionSpecifier = match[5];
        var isFlagSwitch = flags.includes('#');
        var isFlag0      = flags.includes('0');
        var isFlagLeft   = flags.includes('-');
        var isFlagSpace  = flags.includes(' ');
        var isFlagSign   = flags.includes('+');
        var isFlagMoney  = flags.includes("'");
        var isFlagLocal  = flags.includes('l');
        switch (conversionSpecifier) {
          case 'd': case 'i':
            {
              if (isFlagLeft && isFlag0) {
                isFlag0 = false;
                isFlagSpace = true;
              }
              if (null === precision) {
                precision = 1;
              }
              let value = values[this._indexOfValues];
              ++this._indexOfValues;
              if ('string' === typeof value || value instanceof String) {
                let base = 10;
                if (value.startsWith('0b')) {
                  base = 2;
                } else if (value.startsWith('0x')) {
                  base = 16;
                } else if ('0' === value[0]) {
                  base = 8;
                }
                value = parseInt(value, base);
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
              if (isFlagSpace && !resultSign) {
                resultLeftSpace = ' ';
              }
              let mainLength = resultLeftSpace.length + resultSign.length + resultBody.length;
              if (fieldWidth > mainLength) {
                if (isFlagLeft) {
                  resultRight = (isFlag0 ? '0' : ' ').repeat(fieldWidth - mainLength);
                } else {
                  if (isFlag0) {
                    resultLeft0 = '0'.repeat(fieldWidth - mainLength);
                  } else {
                    resultLeftSpace += ' '.repeat(fieldWidth - mainLength);
                  }
                }
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
              if (fieldWidth > resultBody.length) {
                if (isFlagLeft) {
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
  ];

  constructor() {
    super();
  }

  _init() {
    super._init();
    this._indexOfValues = 0;
  }
}

function sprintf(format, ...values) {
  return sprintf.evaluator.evaluate(format, values);
}

sprintf.evaluator = new SprintfEvaluator();

global.sprintf  = sprintf;
// }}} !sprintf

// {{{ !strftime
class StrftimeEvaluator extends Evaluator {
  patterns = [
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
  ];

  constructor() {
    super();
  }
}

function strftime(format, date) {
  return strftime.evaluator.evaluate(format, [date]);
}

strftime.evaluator = new StrftimeEvaluator();

global.strftime = strftime;
// }}} !strftime
}(/*(module && module.exports) || */(this || 0).self || global));

// {{{ !debug
(function () {
'use strict';

var assert    = require('assert');
var cp        = require('child_process');
var fs        = require('fs');
var Mustache  = require('mustache');
var permute   = require('permute');
var promisify = require('./promisify');
var util      = require('util');
var uuid      = require('node-uuid');

const FLAG_SETS = (function () {
  function push() {
    for (let i = 2, iz = flags.length - 1; i <= iz; ++i) {
      let set = flags.slice(0, i).sort().join('');
      if (!sets.includes(set)) {
        sets.push(set);
      }
    }
  }

  var flags = ['-', '#', '0', ' ', '+', "'", 'l'];
  var sets = [''].concat(flags);
  sets.push(flags.join(''));
  flags = flags.sort();
  push();
  while (permute(flags)) {
    push();
  }
  return sets.sort((l, r) => l.length - r.length);
}());

function test(format, ...values) {
  function calcExpected() {
    var expected;
    var tmpId = uuid.v4();
    return promisify(fs.readFile)('printf.c.mustache', {encoding: 'utf8'}).
      then((c) => {
        c = Mustache.render(
          c,
          {
            args: [format, ...values].map((v) => {
                if ('number' === typeof v || v instanceof Number || /^(?:\d+)|(?:0[bx][\da-zA-Z]+)$/.test(v)) {
                  return '' + v;
                }
                return `"${v}"`
              }).join(','),
          }
        )
        return promisify(fs.writeFile)(`printf-${tmpId}.c`, c);
      }).
      then(() => promisify(cp.exec)(`clang -o printf-${tmpId} printf-${tmpId}.c`)).
      then(() => promisify(cp.exec)(`./printf-${tmpId}`)).
      then((v) => expected = v[0].toString()).
      then(() => promisify(fs.unlink)(`printf-${tmpId}`)).
      then(() => promisify(fs.unlink)(`printf-${tmpId}.c`)).
      then(() => expected).
      catch((err) => console.error(err));
  }

  var promise = new Promise(async (resolve, reject) => {
    if (!test.startAt) {
      test.startAt = Date.now();
    }
    var actual   = sprintf(format, ...values);
    var expected = await calcExpected();
    try {
      assert.strictEqual(actual, expected);
    } catch (ex) {
      console.error(`Actual:  \t${util.inspect(ex.actual)}\nExpected:\t${util.inspect(ex.expected)}\n\tArguments:\t${util.inspect(Array.from(arguments))}\n`);
      test.endAt = Date.now();
      test.result.push(false);
      return resolve();
    }
    test.endAt = Date.now();
    test.result.push(true);
    resolve();
  });
  test.promises.push(promise);
  return promise;
}
test.startAt  = null;
test.endAt    = null;
test.promises = [];
test.result   = [];
test.printResult = function () {
  Promise.all(test.promises).then(() => {
    console.log(`${(test.endAt - test.startAt) / 1000} sec`);
    console.log(`${test.result.filter((r) => r).length}/${test.result.length} passed`);
    console.log(test.result.map((r) => r ? '.' : 'F').join(''));
  });
};

test('string');

test('%d', '02322');
test('%d', '0x4d2');
FLAG_SETS.
  filter((set) => {
    if (set.includes('#') || set.includes('l')) {
      return false;
    }
    if (set.includes(' ') && set.includes('+')) {
      return false;
    }
    if (set.includes('0') && set.includes('-')) {
      return false;
    }
    return true;
  }).
  forEach((set) => {
    test(`%${set}d` , 1234);
    test(`%${set}d` , -1234);
    test(`%${set}8d`, 1234);
    test(`%${set}8d`, -1234);
  });

test('a %s b', 'and');
test('%s and %s', 'a', 'b');
test('%4s', 'yu');
test('%-4s', 'yu');

test('%%');

test.printResult();
}());
// }}} !debug
