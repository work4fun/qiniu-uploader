const fs = require('fs');
const glob = require('glob');

function promisify(func, afterArgs=[], beforeArgs=[]) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      func(...beforeArgs, ...args, ...afterArgs, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  };
}

exports.globFiles = promisify(glob, [{nodir: true}]);
