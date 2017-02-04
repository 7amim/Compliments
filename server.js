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

function applyAnalyzer(text) {
  toneAnalyzer.tone({ text: text }, function(err, tone) {
    if (err) {
      console.log(err);
    } else {
      let emotion;
      // console.log(JSON.stringify(tone, null, 2));
      tone.document_tone.tone_categories[0]
          .tones.map((response) => emotion = response);
      return response;
    }
  });
}


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
        let emotion = applyAnalyzer(messageText);
        let strongestEmotion = emotion[0];
        for each (let index in emotion) {
          console.log(emotion.tone_id + " : " + emotion.score);
          if (emotion[index].score >= strongestEmotion.score){
            strongestEmotion = emotion[index];
          }
        }
        if (strongestEmotion !== emotion[0]) {
          sendTextMessage(senderID, messageText);
        } else {
          sendTextMessage(senderID, "Please send a nicer message.");
        }
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
    qs: { access_token: PAGE_ACCESS_TOKEN },
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

app.listen(3000, () => {
  console.log('Listening on port: 3000');
});
