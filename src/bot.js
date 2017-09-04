'use strict';
const BootBot = require('bootbot');
require('dotenv').config()

const bot = new BootBot({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECET
});

bot.on('message', (payload, chat) => {
  const text = payload.message.text;
  chat.say(`Echo: ${text}`);
});

bot.hear(['hello', 'hi', /hey( there)?/i], (payload, chat) => {
  // Send a text message followed by another text message that contains a typing indicator
  chat.say('Hello, human friend!').then(() => {
    chat.say('How are you today?', { typing: true });
  });
});


bot.start();

// function receivedMessage(event) {
//   var senderId = event.sender.id;
//   axios.defaults.headers.post['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;
//   axios.defaults.headers.get['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;

//   if(event.message.attachments) {
//     axios.post('https://eastus2.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false', {
//       'url': event.message.attachments[0].payload.url
//     }).then(function(response) {
//       axios.post('https://eastus2.api.cognitive.microsoft.com/face/v1.0/identify', {
//         'personGroupId': 'person-data',
//         'faceIds': [response.data[0].faceId],
//         'maxNumOfCandidatesReturned': 1,
//         'confidenceThreshold': 0.5
//       }).then(function(response) {
//         if(response.data[0].candidates.length > 0) {
//           axios.get('https://eastus2.api.cognitive.microsoft.com/face/v1.0/persongroups/person-data/persons/'+response.data[0].candidates[0].personId)
//                .then(function(response) {
//                 callSendAPI(senderId, `Hola ${response.data.name}`);
//                }).catch(function (error) {
//                  console.log(error);
//                });
//         } else {
//           callSendAPI(senderId, 'No se encontró un registro con su foto.');
//         }
//       }).catch(function (error) {
//         console.log(error);
//       });
//     }).catch(function (error) {
//       console.log(error);
//     });
//   }

// }
