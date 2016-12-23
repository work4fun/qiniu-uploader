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
parser.addArgument(['-n', '--dry'], {
  help: 'List the files to be uploaded and exit',
  action: 'storeTrue',
});
parser.addArgument(['-b', '--bucket'], {
  help: 'Set qiniu bucket',
});
parser.addArgument(['-B', '--base'], {
  help: 'Set base path, default as current working directory',
});
parser.addArgument(['-p', '--prefix'], {
  help: 'Set prefix for the remote link',
  defaultValue: '',
});
parser.addArgument(['-V', '--verbose'], {
  help: 'Show details during uploading',
  action: 'storeTrue',
});
parser.addArgument('--ak', {
  help: 'Set qiniu access key, default as `process.env.QINIU_ACCESS_KEY`',
});
parser.addArgument('--sk', {
  help: 'Set qiniu secret key, default as `process.env.QINIU_SECRET_KEY`',
});

function parseKeys(args) {
  const ak = args && args.ak || process.env.QINIU_ACCESS_KEY;
  const sk = args && args.sk || process.env.QINIU_SECRET_KEY;
  if (ak) {
    qiniu.conf.ACCESS_KEY = ak;
  }
  if (sk) {
    qiniu.conf.SECRET_KEY = sk;
  }
}

function parse(args) {
  args = args || parser.parseArgs();
  parseKeys(args);
  if (!args.dry) {
    assert.ok(qiniu.conf.ACCESS_KEY, 'Qiniu access key is required!');
    assert.ok(qiniu.conf.SECRET_KEY, 'Qiniu secret key is required!');
    assert.ok(args.bucket, 'Bucket is required!');
  }

  args.base = args.base || path.resolve('.');
  args.patterns.forEach(pattern => {
    assert.ok(!path.relative(args.base, pattern).startsWith('..'), `Invalid pattern: ${pattern}`);
  });

  return args;
}

exports.parseKeys = parseKeys;
exports.parse = parse;
