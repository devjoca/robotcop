const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config()

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;
  if (data.object === 'page') {

    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderId = event.sender.id;
  axios.defaults.headers.post['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;
  axios.defaults.headers.get['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;

  // axios.post('https://eastus2.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false', {
  //   'url': event.message.attachments[0].payload.url
  // }).then(function(response) {
  //   axios.post('https://eastus2.api.cognitive.microsoft.com/face/v1.0/identify', {
  //     'personGroupId': 'person-data',
  //     'faceIds': [response.data[0].faceId],
  //     'maxNumOfCandidatesReturned': 1,
  //     'confidenceThreshold': 0.5
  //   }).then(function(response) {
  //     if(response.data[0].candidates.length > 0) {
  //       axios.get('https://eastus2.api.cognitive.microsoft.com/face/v1.0/persongroups/person-data/persons/'+response.data[0].candidates[0].personId)
  //            .then(function(response) {
  //             callSendAPI(senderId, `Hola ${response.data.name}`);
  //            }).catch(function (error) {
  //              console.log(error);
  //            });
  //     } else {
  //       callSendAPI(senderId, 'No se encontró un registro con su foto.');
  //     }
  //   }).catch(function (error) {
  //     console.log(error);
  //   });
  // }).catch(function (error) {
  //   console.log(error);
  // });
}

function callSendAPI(recipient_id, message) {
  axios.post('https://graph.facebook.com/v2.6/me/messages?access_token='+process.env.PAGE_ACCESS_TOKEN, {
    recipient: {
      id: recipient_id
    },
    message: {
      text: message
    }
  });
}

var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});