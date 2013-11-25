/*!
 * lib/interceptor.js
 * Copyright(c) 2012 - 2013 dead_horse <dead_horse@qq.com>
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */
var net = require('net');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Interceptor constractor
 * @param {Object} options
 * @constructor
 */
var Interceptor = function(target, delay) {
  EventEmitter.call(this);
  this.target = target.split(':');
  if (this.target.length !== 2) {
    throw new Error('target type error, must like 127.0.0.1:6379');
  }
  this.inStream = net.createServer(this._connectionHandler.bind(this));
  this.blocking = false;
  this.outArr = [];
  this.inArr = [];
  this.delay = delay || 0;
};
util.inherits(Interceptor, EventEmitter);

/**
 * listen port
 * @public
 */
Interceptor.prototype.listen = function(port) {
  this.port = port;
  if (!this.inStream._handle) {
    this.inStream.listen.apply(this.inStream, arguments);
  }
};

/**
 * Returns the bound address, the address family name and port of the socket as reported by the operating system.
 * Returns an object with three properties, e.g. { port: 12346, family: 'IPv4', address: '127.0.0.1' }
 * @return {Object}
 *  - {Number} port
 *  - {String} family
 *  - {String} address
 */
Interceptor.prototype.address = function () {
  return this.inStream.address();
};

/**
 * instream connnection handler
 * @param  {net.Socket} socket
 * @private
 */
Interceptor.prototype._connectionHandler = function(socket) {
  var self = this;
  var outStream = net.connect(self.target[1], self.target[0]);
  self.outArr.push(outStream);
  self.inArr.push(socket);
  function outStreamOndata(data) {
    if (!self.blocking) {
      setTimeout(function () {
        socket.write(data);
      }, self.delay);
    }
  }

  function outStreamOnend(data) {
    if (!self.blocking) {
      setTimeout(function () {
        socket.end(data);
      }, self.delay);
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
  self.emit('_connect', socket);
};

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
};

/**
 * open the net
 * @public
 */
Interceptor.prototype.open = function() {
  this.blocking = false;
  //proxy重新监听
  this.port && this.listen.call(this, this.port);
};

/**
 * really close the server
 */
Interceptor.prototype.close = function() {
  this.outArr.forEach(function (c) {
    c.destroy();
  });
  this.inArr.forEach(function (c) {
    c.destroy();
  });
  this.outArr = [];
  this.inArr = [];
  if (this.inStream._handle) {
    this.inStream.close();
  }
};

Interceptor.prototype.error = function () {
  this.inArr.forEach(function (s) {
    s.emit('error', new Error('Interceptor mock socket error'));
  });
};

exports.create = function(target, delay) {
  return new Interceptor(target, delay);
};
