'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');
const toneAnalyzer = new ToneAnalyzerV3({
  "url": "https://gateway.watsonplatform.net/tone-analyzer/api",
  "username": "f3be3dc4-eb50-4fd4-880b-9a3b61e96b8c",
  "password": "5AYAWWpWSFmZ",
  version_date: '2016-05-19'
});

function applyAnalyzer(text, callback) {
  toneAnalyzer.tone({ text: text }, function(err, tone) {
    if (err) {
      console.log(err);
    } else {
      let emotions = [];
      tone.document_tone.tone_categories[0]
          .tones.map((emotion) => emotions.push(emotion));
      callback(emotions);
    }
  });
}


app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'keyIsCompliments') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  let data = req.body;
  console.log('post');
  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      let pageID = entry.id;
      let timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  let senderID = event.sender.id;
  let recipientID = event.recipient.id;
  let timeOfMessage = event.timestamp;
  let message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  let messageId = message.mid;

  let messageText = message.text;
  let messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;

      default:
        applyAnalyzer(messageText, (emotions) => {
          let strongestEmotion = emotions[0];
          emotions.forEach((emotion) => {
            if (emotion.score >= strongestEmotion.score){
              strongestEmotion = emotion;
            }
          });
          sendTextMessage(senderID, emotion.tone_id + " : " + emotion.score);
        });
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAADwhhaDOhgBAHFrDaMm2QNBKZCTYoMbh8RljxYpDunouhbZA9JDZATBbwB74K0t869SZAufZAIKlXoPeeF9rjXGL2JiF0ZCts8cLm6D9mfzZB4l0Q4H4N2dQxrz2SVxMGVwPWApVtWO1zyYBWAdl7bjth6lKwIkAiVM3vNvxZBZBugZDZD' },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}


// Token: curl -ik -X POST "EAAXHyMQZAUEwBAJYANStY4MbhK3sj70V8XGmaJMfCA7WCJdxCJvwjIYg6FApHfYPz44G811b4sWZAvfLEa8ompZArd1pZARsZBP8eAvvohnE0iPy94NKT3bOg4tBHzmqt2PGpDZB6zJ3h3GlqvHc3VZCBMJVzZBmOEhaIhMk5QH38AZDZD"

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port: 3000');
});
