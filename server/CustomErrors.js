'use strict';
'use 6to5';
'use babel';

class CustomError extends Error {
  constructor(message) {
    if (message instanceof Error) {
      super(message.message);
      this.stack = message.stack;
      for (let k in message) {
        this[k] = message[k];
      }
    } else {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.message = message;
    }

    this.name = this.constructor.name;

  }
}

class ConnectionError extends CustomError {
  constructor (message, addr, port) {
    super(message);
    this.address = addr || this.address || '';
    this.port = port || this.port || -1;
  }
}

class InvalidLoginError extends CustomError {}

class TimeoutError extends ConnectionError {}
class NotConnectedError extends ConnectionError {}
class FileSystemError extends CustomError {}
class ConfigurationError extends CustomError {}
class CancelError extends CustomError {}

module.exports = {
  ConnectionError,
  TimeoutError,
  NotConnectedError,
  InvalidLoginError,
  FileSystemError,
  ConfigurationError,
  CancelError
};
