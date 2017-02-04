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


const express = require('express');
const app = express();

const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
const toneAnalyzer = new ToneAnalyzerV3({
  "url": "https://gateway.watsonplatform.net/tone-analyzer/api",
  "username": "f3be3dc4-eb50-4fd4-880b-9a3b61e96b8c",
  "password": "5AYAWWpWSFmZ",
  version_date: '2016-05-19'
});

toneAnalyzer.tone({ text: 'I hate everyone' }, function(err, tone) {
  if (err) {
    console.log(err);
  } else {
    // console.log(JSON.stringify(tone, null, 2));
    tone.document_tone.tone_categories[0]
        .tones.map((emotion) => console.log(emotion.tone_id + " : " + emotion.score ));
  }
});

app.post();

app.get('/*', (req, res) => {
  // console.log(req.url)
  const text = req.url;
  toneAnalyzer.tone({ text }, function(err, tone) {
    if (err) {
      console.log(err);
    } else {
      res.send(JSON.stringify(tone, null, 2));
    }
  });

});

app.listen(80, () => {
  console.log('Listening on port: 3000');
});
