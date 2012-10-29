interceptor
===========

## 作用
模拟应用依赖模块所在机房单向断网的情况。 可能导致应用与依赖模块（如mongo, redis）连接仍然存在，但是所有发送的请求都无法响应。   

## Usage
```js
var interceptor = require('interceptor');
var blocker = interceptor.create('localhost:6379');
blocker.listen(6380);
```

## Method
`block`: 阻塞依赖模块向应用发送的响应，并且在应用与它的连接断开之后不在监听，无法重新连接。
`open`: 不再阻塞依赖模块向应用发送的响应，并且允许应用重新连接。   

## Install
npm install interceptor

## Lincense
(The MIT License)

Copyright (c) 2012 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
