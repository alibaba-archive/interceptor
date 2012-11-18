/*!
 * lib/interceptor.js 
 * Copyright(c) 2012 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var net = require('net');

/**
 * Interceptor constractor
 * @param {Object} options 
 * @constructor
 */
var Interceptor = function(target) {
  this.target = target.split(':');
  if (this.target.length !== 2) {
    throw new Error('target type error, must like 127.0.0.1:6379');
  }
  this.inStream = net.createServer(this._connectionHandler.bind(this));
  this.blocking = false;
  this.outArr = [];
}

/**
 * listen port
 * @public
 */
Interceptor.prototype.listen = function(port) {
  this.port = port;
  if (!this.inStream._handle) {
    this.inStream.listen.apply(this.inStream, arguments);
  }
}

/**
 * instream connnection handler
 * @param  {net.Socket} socket 
 * @private
 */
Interceptor.prototype._connectionHandler = function(socket) {
  var self = this;
  var outStream = net.connect(self.target[1], self.target[0]);
  self.outArr.push(outStream);
  function outStreamOndata(data) {
    if (!self.blocking) {
      socket.write(data);
    }
  }

  function outStreamOnend(data) {
    if (!self.blocking) {
      socket.end(data);
    }
  }

  function inStreamOndata(data) {
    if (!self.blocking) {
      outStream.write(data);
    }
  }

  function inStreamOnend(data) {
    if (!self.blocking) {
      outStream.end(data);
      for (var i = 0, l = self.outArr.length; i < l; i++) {
        if (self.outArr[i] === outStream) {
          self.outArr.splice(i, 1);
          break;
        }
      }      
    }
  }

  socket.on('data', inStreamOndata);
  socket.on('end', inStreamOnend);
  socket.on('error', cleanup);
  outStream.on('data',outStreamOndata);
  outStream.on('end', outStreamOnend);
  outStream.on('error', cleanup);

  function cleanup() {
    //移除所有listener，destory两边的连接
    socket.removeListener('data', inStreamOndata);
    socket.removeListener('end', inStreamOnend);
    outStream.removeListener('data', outStreamOndata);
    outStream.removeListener('end', outStreamOnend);
    outStream.destroy();
    socket.destroy();
    for (var i = 0, l = self.outArr.length; i < l; i++) {
      if (self.outArr[i] === outStream) {
        self.outArr.splice(i, 1);
        break;
      }
    }
  }
}

/**
 * block the net
 * @public
 */
Interceptor.prototype.block = function() {
  this.blocking = true;
  //如果阻塞，不能够再与代理建立新的连接
  if (this.inStream._handle) {
    this.inStream.close();
  }
}

/**
 * open the net
 * @public
 */
Interceptor.prototype.open = function() {
  this.blocking = false;
  //proxy重新监听
  this.port && this.listen.call(this, this.port);
}

Interceptor.prototype.close = function() {
  this.outArr.forEach(function (c) {
    c.end();
  });
  this.outArr = [];
  if (this.inStream._handle) {
    this.inStream.close();
  }
}

exports.create = function(target) {
  return new Interceptor(target);
}
