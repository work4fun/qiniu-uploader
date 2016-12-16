const qiniu = require('qiniu');
const utils = require('./utils');

function putToken(scope, extra={}) {
  const options = Object.assign({
    scope,
    expires: 100,
  }, extra);
  const putPolicy = new qiniu.rs.PutPolicy2(options);
  return putPolicy.token();
}

function upload(options, {key, data, type}) {
  let bucket, saveKey;
  if (typeof options === 'string') {
    bucket = options;
  } else {
    bucket = options.bucket;
    saveKey = options.saveKey;
  }
  return new Promise((resolve, reject) => {
    const scope = key ? `${bucket}:${key}` : bucket;
    const token = putToken(scope, {
      saveKey,
      returnBody: `{"path":"${saveKey}"}`,
    });
    const handle = {
      raw: qiniu.io.put,
    }[type] || qiniu.io.putFile;
    handle(token, key, data, null, (err, ret) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          data,
          url: ret.path || key,
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

exports.putToken = putToken;
exports.upload = upload;
exports.getFiles = getFiles;
exports.uploadFiles = uploadFiles;
