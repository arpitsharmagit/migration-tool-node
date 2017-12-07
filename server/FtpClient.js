'use babel';
'use strict';

var path = require('path').posix,
    fs = require('fs'),
    JSFtp = require('jsftp'),
    Q = require('q'),
    _ = require('lodash'),
    ProgressStream = require('./ProgressStream'),
    Throttle = require('stream-throttle').Throttle,
    {ConnectionError, TimeoutError, NotConnectedError, InvalidLoginError} = require('./CustomErrors');

function swapDefer (previous, resolveValue) {
  let deferred = Q.defer();
  if (previous) {
    previous.resolve(deferred);
  }

  if (resolveValue) {
    deferred.promise.done(_.noop, _.noop);
    if (resolveValue instanceof Error) {
      resolveValue = Q.reject(resolveValue);
    }
    deferred.resolve(resolveValue);
  }

  return deferred;
}

class  {
  constructor(opts, port, user, pass, macAddress) {
    if (!_.isObject(opts)) {
      opts = {
        addr: opts,
        port: port || 21,
        user: user,
        pass: pass,
        macAddress: macAddress
      };
    }

    _.extend(this, _.pick(opts, ['addr', 'port', 'user', 'pass', 'macAddress']));

  }
  connect (addr = this.addr, port = this.port, user = this.user, pass = this.pass) {
    if (_.isObject(addr)) {
      let opts = addr;
      return this.connect(opts.addr, opts.port, opts.user, opts.pass);
    }

    if (this.isConnected || this.isConnecting) {
      return this.promise;
    }

    if (!addr || !port || !user || !pass) {
      return Q.reject(new Error('invalid parameters'));
    }

    let _connection = this.deferred = swapDefer(this.deferred);
    //_connection.promise.done(); // ignore uncaught exceptions

    if(this.client) this.client.destroy();
    this.client = new JSFtp({ host: addr, port: port });

    let events = {
      connect: () => {
        // perform login
        _connection.resolve(this.login(user, pass));
      },
      error: (err) => {
        console.warn('Connection Error!', err);
        let ErrorClass = (err.code === 'ETIMEDOUT') ?
                          TimeoutError :
                          ConnectionError;
        _connection.reject(new ErrorClass(err, addr));
      },
      timeout: () => _connection.reject(new TimeoutError('on connect'))
    };
    _.each(events, (cb, event) => this.client.on(event, cb));

    return _connection.promise;
  }
  login (user = this.user, pass = this.pass) {
    let d = Q.defer();

    this.client.auth(user, pass, d.makeNodeResolver());

    return d.promise.then((result) => {
      if (result.isError) {
        let err;
        switch (result.code) {
          case 530:
            err = new InvalidLoginError(result);
            break;
          default:
            err = result;
        }
        return Q.reject(err);
      } else {
        return Q.resolve(result);
      }
    });
  }

  disconnect () {
    this.client && this.client.destroy();
    this.client = null;

    this.deferred = swapDefer(this.deferred, new NotConnectedError('not connected'));

    return Q.resolve('disconnected');
  }
  get isConnecting () {
    return this.promise && this.promise.isPending();
  }
  get isConnected () {
    return this.promise && this.promise.isFulfilled();
  }
  get promise () {
    return this.deferred && this.deferred.promise;
  }

  ls (remotePath = '.', options = { recursive: true }) {
    let recursive = _.get(options, 'recursive', true),
        isGlob = /\*/.test(remotePath),
        isSingleFile = path.extname(remotePath),
        folder = isGlob || isSingleFile ? path.dirname(remotePath) : remotePath,
        d = Q.defer();

    this.client.ls(remotePath, d.makeNodeResolver());

    return d.promise.then((result) => {
      if (result.isError) {
        return Q.reject(result);
      }

      let promise = Q.all(_.map(result, item => {
        item.folder = folder;
        item.path = path.join(folder, item.name);
        item.isDirectory = (item.type === 1);
        // if directory return array of item and all sub-entries
        if (recursive && item.isDirectory && item.userPermissions.read) {
          // TODO: what happens with permissions issues? should we swallow errors?
          let listChild = this.ls(item.path, recursive);
          return listChild.then(list => [item].concat(list));
        }
        return item;
      })).then(items => _.flatten(items) );

      return promise;
    });
  }

  // DME = require('./DME'); x = new DME('192.168.159.136', 21, 'admin', 'admin'); z = x.connect().then(l,w,l).then(()=>x.ls()).tap(l,w,l);
  // FIXME if folder is specified without trailing slash then folder variable will be incorrect (i.e. '.' instead of 'UploadedVideos')
  mkdir (fullPath, options = { safe: true }) {
    let dirPath = (path.extname(fullPath) ? path.dirname(fullPath) : fullPath),
        dirParts = _.trim(dirPath, path.sep).split(path.sep);

    // special case -- don't check if parent directories exist
    if (!_.get(options, 'safe', true)) {
      dirParts = [dirPath];
    }
    return Q.async(function* () {
      let currentDir = '';
      for (let dir of dirParts) {
        currentDir = path.join(currentDir, dir);
        let dirExists = yield this.exists(currentDir);
        if (!dirExists) {
          let d = Q.defer();
          this.client.raw.mkd(currentDir, d.makeNodeResolver());
          yield d.promise;
        }
      }
    }).call(this);
  }
  exists (remotePath) {
    let d = Q.defer();

    this.client.raw.stat(remotePath, d.makeNodeResolver());
    return d.promise.then((result) => {
      if (result.isError || !result.text) {
        return Q.reject(result);
      }

      let re = new RegExp(_.escapeRegExp(path.extname(remotePath) || '..') + '\\n');
      if (re.test(result.text)) {
        return true;
      } else {
        return false;
      }
    });
  }

  get (remotePath, localPath) {
    if (!remotePath || !localPath) {
      return Q.reject('Remote / Local path not specified');
    }

    let d = Q.defer();

    this.client.get(remotePath, localPath, d.makeNodeResolver());
    return d.promise;
  }

  put (localPath, remotePath) {
    if (!remotePath || !localPath) {
      return Q.reject('Remote / Local path not specified');
    }

    let d = Q.defer();

    this.client.put(localPath, remotePath, d.makeNodeResolver());
    return d.promise;
  }

  getGetSocket (remotePath) {
    let d = Q.defer();

    this.client.getGetSocket(remotePath, d.makeNodeResolver());

    return d.promise;

  }

  getPutSocket (remotePath) {
    let d = Q.defer();

    this.client.getPutSocket(remotePath, d.makeNodeResolver());

    return d.promise;

  }

  rename (from, to) {
    if (!from || !to) {
      return Q.reject('new / old path not specified');
    }

    let d = Q.defer();

    this.client.rename(from, to, d.makeNodeResolver());

    return d.promise;
  }

  transfer (destinationServer, remotePath, destinationPath, options = {}) {
    var d = Q.defer(),
        progressInterval = _.result(options, 'interval', 500),
        overwrite = _.result(options, 'overwrite', true),
        throughput = _.result(options, 'throughput', 0),
        totalBytes;

    if (!destinationPath) {
      destinationPath = remotePath;
    }

    // request read/write streams and optionally get info about existing files
    Q.all([
      this.getGetSocket(remotePath),
      destinationServer.getPutSocket(destinationPath),
      this.ls(remotePath),
      destinationServer.ls(destinationPath)
    ]).spread( (readStream, writeStream, sourceStat, destinationStat) => {
      if (_.isEmpty(sourceStat)) {
        return d.reject('Source file does not exist: ' + remotePath);
      } else {
        totalBytes = sourceStat[0].size;
      }

      if (!overwrite && !_.isEmpty(destinationStat)) {
        if (destinationStat[0].size !== sourceStat[0].size) {
          return d.reject('File already exists, but has different size');
        } else {
          return d.resolve('File already exists on destination');
        }
      }

      try {

        // pipe input stream through progressStream to track progress
        let progressStream = new ProgressStream({
          length: totalBytes,
          interval: progressInterval
        });

        progressStream.on('progress', d.notify);


        writeStream.on('close', d.resolve);
        writeStream.on('error', d.reject);
        readStream.on('error', d.reject);

        // if throughput is defined and greater than 0 then limit bandwidth
        if (throughput) {
          let throttleStream = new Throttle({ rate: throughput });
          readStream.pipe(progressStream).pipe(throttleStream).pipe(writeStream);
        } else {
          readStream.pipe(progressStream).pipe(writeStream);
        }

        readStream.resume();

      } catch (err) {
        d.reject(err);

        if (writeStream) writeStream.end();
        if (readStream && readStream.destroy) readStream.destroy();

      }

      return d.promise;

    }).catch(d.reject).done();

    return d.promise;

  }

  edgeIngest (localPath, metadata = {noMetadata: 1}, options) {
    metadata = _({})
      .extend(metadata)
      .pick(['Title', 'Description', 'Categories', 'Tags', 'EnableComments', 'EnableRatings', 'EnableDownloads', 'Uploader', 'IsActive', 'VideoAccessControl', 'AccessControlEntities', 'noMetadata'])
      .value();

    if (!fs.existsSync(localPath)) {
      return Q.reject('File does not exist: ' + localPath);
    }

    // escape single quotes
    let remotePath = '/EdgeIngest/' + path.basename(localPath),
        jsonPath = remotePath.slice(0, -1 * path.extname(localPath).length) + '.json',
        jsonContent = JSON.stringify(metadata).replace(/'/g, '\u0027'),
        jsonUploaded = this.put(new Buffer(jsonContent), jsonPath);

    let putDeferred = Q.defer(),
        ingestPromise = this.getPutSocket(remotePath);

    Q.all([ingestPromise, jsonUploaded]).spread( (writeStream, metadataDone) => {
      let readStream;
      try {
        readStream = fs.createReadStream(localPath);

        let progressInterval = _.result(options, 'interval', 500),
            progressStream = new ProgressStream({ interval: progressInterval });

        progressStream.on('progress', putDeferred.notify);
        writeStream.on('close', putDeferred.resolve);
        writeStream.on('error', putDeferred.reject);
        readStream.on('error', putDeferred.reject);

        readStream.pipe(progressStream).pipe(writeStream);
        readStream.resume();

      } catch (err) {
        putDeferred.reject(err);
      } finally {
        if (writeStream) writeStream.end();
        if (readStream && readStream.destroy) readStream.destroy();
      }
    }).catch(putDeferred.reject).done();

  }

}

module.exports = FtpClient;
