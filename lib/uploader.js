const qiniu = require('qiniu');
const utils = require('./utils');

function putToken(scope, expires=100) {
  const putPolicy = new qiniu.rs.PutPolicy2({
    scope,
    expires,
  });
  return putPolicy.token();
}

function upload(bucket, {key, data, type}) {
  return new Promise((resolve, reject) => {
    const token = putToken(bucket + ':' + key);
    const handle = {
      raw: qiniu.io.put,
    }[type] || qiniu.io.putFile;
    handle(token, key, data, null, (err, _ret) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          data,
          url: key,
        });
      }
    });
  })
  // handle might throw error directly, so we have to catch error afterwards
  .catch(err => {
    throw `${key}: ${err}`;
  });
}

function getFiles(pattern, keyFunc) {
  if (!keyFunc) keyFunc = path => path;
  return utils.globFiles(pattern)
  .then(matches => matches.map(file => ({
    key: keyFunc(file),
    data: file,
  })));
}

function uploadFiles(bucket, files, cb) {
  const progress = {
    finished: 0,
    total: files.length,
  };
  cb && cb(progress);
  return Promise.all(files.map(file => upload(bucket, file).then(item => {
    progress.finished ++;
    cb && cb(progress, item);
    return {url: item.url, path: item.data};
  })));
}

exports.upload = upload;
exports.getFiles = getFiles;
exports.uploadFiles = uploadFiles;
