qiniu-uploader
===

A command tool to upload files to qiniu

Installation
---

```sh
$ npm i qiniu-uploader -g
```

Usage
---

```
usage: qiniu-upload [-h] [-v] [--base BASE] -b BUCKET [-p PREFIX] [--verbose]
                    [--ak AK] [--sk SK]
                    patterns [patterns ...]

Upload files to qiniu

Positional arguments:
  patterns              Set glob pattern to filter files

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  --base BASE           Set base path, default as current working directory
  -b BUCKET, --bucket BUCKET
                        Set qiniu bucket
  -p PREFIX, --prefix PREFIX
                        Set prefix for the remote link
  --verbose             Show details during uploading
  --ak AK               Set qiniu access key, default as `process.env.
                        QINIU_ACCESS_KEY`
  --sk SK               Set qiniu secret key, default as `process.env.
                        QINIU_SECRET_KEY`
```
