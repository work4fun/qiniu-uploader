const path = require('path');
const readline = require('readline');
const uploader = require('./uploader');
const parser = require('./args');
parser.parseKeys();

function uploadAll(args) {
  function buildKey(filepath) {
    return path.join(args.prefix, path.relative(args.base, filepath));
  }

  function onUpload(progress, item) {
    let file = '';
    if (item) {
      file = item.path;
    }
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`\rUploading... ${progress.finished}/${progress.total}(${file})`);
  }

  function doUpload(items, args) {
    let uploadOptions = args;

    return uploader.uploadFiles(uploadOptions, items, args.verbose && onUpload)
    .then(items => {
      if (args.verbose) {
        process.stdout.write(`\rFinished${' '.repeat(10)}\n`);
      }
      return items.map(item => ({
        url: item.url,
        path: path.relative(args.base, item.path),
      }));
    });
  }

  function listItems(items) {
    return items.map(item => `${item.data} => ${item.key}`).join('\n');
  }

  args = parser.parse(args);

  return Promise.all(args.patterns.map(pattern => uploader.getFiles(pattern, buildKey)))
  .then(lists => lists.reduce((res, item) => res.concat(item), []))
  .then(args.dry ? listItems : (items) => {
    return doUpload(items, args);
  });
}

module.exports = Object.assign(uploadAll, uploader, {
  parser,
});
