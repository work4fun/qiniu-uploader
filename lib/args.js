const path = require('path');
const assert = require('assert');
const qiniu = require('qiniu');
const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  version: require('../package.json').version,
  description: 'Upload files to qiniu',
});
parser.addArgument('patterns', {
  help: 'Set glob pattern to filter files',
  nargs: '+',
});
parser.addArgument('--base', {
  help: 'Set base path, default as current working directory',
  defaultValue: path.resolve('.'),
});
parser.addArgument(['-b', '--bucket'], {
  help: 'Set qiniu bucket',
});
parser.addArgument(['-p', '--prefix'], {
  help: 'Set prefix for the remote link',
  defaultValue: '',
});
parser.addArgument(['-n', '--dry'], {
  help: 'List the files to be uploaded and exit',
  action: 'storeTrue',
});
parser.addArgument('--verbose', {
  help: 'Show details during uploading',
  action: 'storeTrue',
});
parser.addArgument('--ak', {
  help: 'Set qiniu access key, default as `process.env.QINIU_ACCESS_KEY`',
  defaultValue: process.env.QINIU_ACCESS_KEY,
});
parser.addArgument('--sk', {
  help: 'Set qiniu secret key, default as `process.env.QINIU_SECRET_KEY`',
  defaultValue: process.env.QINIU_SECRET_KEY,
});

const args = module.exports = parser.parseArgs();

if (!args.dry) {
  assert.ok(args.ak, 'Qiniu access key is required!');
  assert.ok(args.sk, 'Qiniu secret key is required!');
  assert.ok(args.bucket, 'Bucket is required!');
}

qiniu.conf.ACCESS_KEY = args.ak;
qiniu.conf.SECRET_KEY = args.sk;

args.patterns.forEach(pattern => {
  assert.ok(!path.relative(args.base, pattern).startsWith('..'), `Invalid pattern: ${pattern}`);
});
