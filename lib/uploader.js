const qiniu = require('qiniu');
const utils = require('./utils');
const fs = require('fs');
const crypto = require('crypto');

/// Uploader Options
const OPTIONS = {
  Bucket: 'bucket',   // string
  SaveKey: 'saveKey', // string
  Expires: 'expires', // int
  ProgressCallback: 'progressCallback', // callback
  Resume: 'resume',  // bool
}

/// token expires as default
const DEFAULT_EXPIRES = 100;

function makeBucketManager() {
  const mac = new qiniu.auth.digest.Mac(qiniu.conf.ACCESS_KEY, qiniu.conf.SECRET_KEY);
  const config = new qiniu.conf.Config();
  return bucketManager = new qiniu.rs.BucketManager(mac, config);
}

/**
 * 计算md5 hash
 * @param {string} data 
 */
function md5hash(data) {
  const md5sum = crypto.createHash('md5');
  md5sum.update(data);
  return md5sum.digest('hex');
}

function getResumeProgressLogPath(fileHash) {
  const logDir = '/tmp/.qiniu-upload-nodejs/';
  const logPath = `${logDir}${fileHash}`;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  fs.openSync(logPath, 'w+');
  return logPath;
}

function getUploadedLogDir() {
  const logDir = '/tmp/.qiniu-uploaded-nodejs/';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  return logDir;
}

function putToken(scope, extra = {}) {
  const options = Object.assign({
    scope,
    expires: 100,
  }, extra);

  const putPolicy = new qiniu.rs.PutPolicy(options);

  return putPolicy.uploadToken();
}

function getOptions(options, key, defaultValue = null) {
  if (typeof options === 'string') {
    return null;
  }
  return options[key] || defaultValue;
}

/// get bucketname from options
/// options examples
/// 1. 'bucket name'
/// See const OPTIONS 
/// 2. { bucket: 'bucket name', saveKey: 'file save key', 'expires': 'token expires' }
function getBucketName(options) {
  let bucket = getOptions(options, OPTIONS.Bucket, null);

  if (bucket === null) {
    bucket = options;
  }

  return bucket;
}

/**
 * make upload scope
 * @param {string} bucketName qiniu bucket name
 * @param {string} key upload file key
 */
function makeScope(bucketName, key) {
  if (key) {
    return `${bucketName}:${key}`;
  }
  return bucketName;
}



function upload(options, { key, data: path, type }) {
  let bucket = getBucketName(options);
  let saveKey = getOptions(options, OPTIONS.SaveKey, null);
  let expires = parseInt(getOptions(options, OPTIONS.Expires, DEFAULT_EXPIRES), 10);
  return new Promise((resolve, reject) => {
    const scope = makeScope(bucket, key);

    tokenOptions = {
      expires,
    }

    if (saveKey) {
      tokenOptions = Object.assign({
        saveKey,
        returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
      }, tokenOptions);
    }

    const token = putToken(scope, tokenOptions);

    var config = new qiniu.conf.Config();
    var resumeUploader = new qiniu.resume_up.ResumeUploader(config);
    var putExtra = new qiniu.resume_up.PutExtra();

    putExtra.progressCallback = options.progressCallback;


    /// 如果开启了断点续传, 会将已经上传过的文件记录下来, 下次上传的时候跳过. 同时上传文件时将记录 progress log
    /// 每次断开将从上次的记录继续上传, 防止弱网环境下无法上传成功
    /// 如果存在则跳过上传. 弱网环境上传大文件会比较有用
    if (options[OPTIONS.Resume]) {
      const hash = md5hash(path);
      const uploadedDir = getUploadedLogDir();

      if (fs.existsSync(`${uploadedDir}${hash}`)) {
        console.log('skip uplaod file', path);
        return resolve({
          path,
          url: saveKey || key
        });
      }

      /// 创建断点续传日志
      const progressLogPath = getResumeProgressLogPath(hash);
      putExtra.resumeRecordFile = progressLogPath;
    }

    // fs.writeFileSync(`/tmp/upload/${index}`, '');
    // putExtra.resumeRecordFile = `/tmp/upload/${index}`;
    const request = resumeUploader.putFile(token, key, path, putExtra, (err, ret) => {
      if (err) {
        return reject(err);
      }

      /// 开启断点续传记录文件上传成功记录
      if (options[OPTIONS.Resume]) {
        const hash = md5hash(path);
        const uploadedDir = getUploadedLogDir();
        fs.openSync(`${uploadedDir}${hash}`, 'w+');
      }

      return resolve({
        path,
        url: ret.path || key,
      });
    });
  })
    // handle might throw error directly, so we have to catch error afterwards
    .catch(err => {
      console.error(err);
      throw `${key}`;
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

function uploadFiles(bucket, files, cb = () => { }) {
  const progress = {
    finished: 0,
    total: files.length,
  };
  return Promise.all(files.map((file, index) => upload(bucket, file).then(item => {
    progress.finished++;
    cb(progress, item);
    return { url: item.url, path: item.path };
  })));
}

exports.putToken = putToken;
exports.upload = upload;
exports.getFiles = getFiles;
exports.uploadFiles = uploadFiles;
exports.uploaderOptions = OPTIONS;