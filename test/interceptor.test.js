var interceptor = require('../');
var http = require('http');
var should = require('should');
var net = require('net');

describe('#interceptor', function() {
  it('should throw error by wrong target', function () {
    try {
      interceptor.create('127.0.0.1');
    } catch (err) {
      err.message.should.equal('target type error, must like 127.0.0.1:6379');
    }
  });
  describe('#net', function() {
    var _server;
    var proxy;
    var client;
    before(function() {
      _server = net.createServer(function(s) {
        s.pipe(s);
        s.on('error', function(err) {
        });
      });
      _server.listen(16789);
      proxy = interceptor.create('127.0.0.1:16789');
      proxy.listen(16788);
      client = net.connect(16788, '127.0.0.1');
    });

    after(function() {
      proxy.close();
      _server.close();
    });

    it('should ok at first', function(done) {
      client.once('data', function(data) {
        String(data).should.equal('ping');
        done();
      });
      client.write('ping');
    });

    it('should ok connect twice', function(done) {
      var count = 2;
      var client2 = net.connect(16788, '127.0.0.1');
      client2.once('data', function(data) {
        String(data).should.equal('ping');
        if (--count === 0){
          client2.end();
          setTimeout(function () {
            done();
          }, 100);
        }
      });
      client2.write('ping');

      client.once('data', function(data) {
        String(data).should.equal('ping');
        if (--count === 0){
          client2.end();
          setTimeout(function () {
            done();
          }, 100);
        }
      });
      client.write('ping');
    });

    it('should intercept by proxy', function(done) {
      proxy.block();
      var timer = setTimeout(function() {
        client.end();
        setTimeout(function() {
          _server._connections.should.equal(1);
          done();
        }, 100);
      }, 100);
      client.once('data', function(data) {
        clearTimeout(timer);
      });
      client.write('ping');
    });

    it('should reopen ok', function(done) {
      proxy.open();
      client = net.connect(16788, '127.0.0.1');
      client.once('data', function(data) {
        String(data).should.equal('ping');
        done();
      });
      client.write('ping');
    });

    it('should emit error ok', function (done) {
      client.on('close', function () {
        done();
      });
      proxy.outArr[1].emit('error', new Error('mock error'));
      proxy.outArr.length.should.equal(1);
    });

    it('should end ok', function(done) {
      client.end();
      setTimeout(function(){
        _server._connections.should.equal(1);
        done();
      },100);
    });
  });

  describe('#http', function() {
    var _server;
    var proxy;
    var client;
    before(function() {
      _server = http.createServer(function(req, res) {
        res.end(req.method + req.url);
      });
      _server.listen(16789);
      proxy = interceptor.create('127.0.0.1:16789');
      proxy.listen(16788);
    });

    after(function() {
      proxy.close();
      _server.close();
    });
    var _res;
    it('should ok at first', function(done) {
      http.get('http://127.0.0.1:16788/test', function(res) {
        res.statusCode.should.equal(200);
        res.on('data', function(data) {
          String(data).should.equal('GET/test');
          done();
        });
      });
    });

    it('should intercept by proxy', function(done) {
       proxy.block();
       http.get('http://127.0.0.1:16788/test', function(res) {
       }).on('error', function (err) {
         err.code.should.equal('ECONNREFUSED');
         done();
       });
    });

    it('should reopen ok', function(done) {
      proxy.open();
      http.get('http://127.0.0.1:16788/test', function(res) {
        res.statusCode.should.equal(200);
        res.on('data', function(data) {
          String(data).should.equal('GET/test');
          done();
        });
      });
    });
  });
});
