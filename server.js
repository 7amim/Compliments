var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
const server = express();

server.get('/', function (req, res) {
    res.send("Hello World!");
});


var sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: 'sayhello'
};
https.createServer(sslOptions, server).listen(8443)

