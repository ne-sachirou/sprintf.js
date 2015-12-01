'use strict';

function promisify(func) {
  return function (...args) {
    var me = this;
    return new Promise((resolve, reject) => {
      function done(err, ...results) {
        if (err) {
          console.error(err);
          return reject(err);
        }
        if (0 === results.length) {
          resolve.call(me);
        } else if (1 === results.length) {
          resolve.call(me, results[0]);
        } else {
          resolve.call(me, results);
        }
      }

      args.push(done);
      func.apply(me, args);
    });
  };
}

module.exports = promisify;
