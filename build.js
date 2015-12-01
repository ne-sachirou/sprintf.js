#!/usr/bin/env babel-node
'use strict';

import * as babel from 'babel-core';
import fs         from 'fs';
import primisify  from './promisify';

const COMPONENTS = {
  sprintf : true,
  strftime: false,
  debug   : false,
};

Promise.all([
    promisify(fs.readFile)('sprintf.js', {encoding: 'utf8'}),
    promisify(fs.readFile)('package.json', {encoding: 'utf8'}),
  ]).
  then((values) => {
    var code   = values[0];
    var config = JSON.parse(values[1]).babel;
    for (let compoment in COMPONENTS) if (COMPONENTS.hasOwnProperty(compoment)) {
      if (!COMPONENTS[compoment]) {
        code = code.replace(new RegExp(`^// {{{ !${compoment}(?:.|\n)*^// }}} !${compoment}`, 'mg'), '');
      }
    }
    code = babel.transform(code, config).code;
    return promisify(fs.writeFile)('sprintf.min.js', code);
  }).
  catch((err) => console.error(err));
