#!/usr/bin/env node

require('..')()
.then(res => {
  if (typeof res === 'string') {
    // dry
    console.log(res);
  } else {
    console.log(`\rUploaded ${res.length} files:\n`);
    console.log(JSON.stringify(res, null, 2));
  }
}, err => {
  console.error(err);
  process.exit(2);
});
