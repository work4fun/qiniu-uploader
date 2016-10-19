const path = require('path');
const args = require('./args');
const uploader = require('./uploader');

function buildKey(filepath) {
  return path.join(args.prefix, path.relative(args.base, filepath));
}

function onUpload(progress, item) {
  process.stdout.write(`\rUploading... ${progress.finished}/${progress.total}`);
}

function doUpload(items) {
  return uploader.uploadFiles(args.bucket, items, args.verbose && onUpload)
  .then(items => {
    if (args.verbose) {
      process.stdout.write(`Uploaded ${items.length} files:\n\n`);
    }
    process.stdout.write(JSON.stringify(items.map(item => ({
      url: item.url,
      path: path.relative(args.base, file.path),
    })), null, 2));
  });
}

function listItems(items) {
  items.forEach(item => {
    process.stdout.write(`${item.data} => ${item.key}\n`);
  });
}

Promise.all(args.patterns.map(pattern => uploader.getFiles(pattern, buildKey)))
.then(lists => lists.reduce((res, item) => res.concat(item), []))
.then(args.dry ? listItems : doUpload);
