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

bot.hear(['food', 'hungry'], (payload, chat) => {
  // Send a text message with quick replies
  chat.say({
    text: 'What do you want to eat today?',
    quickReplies: ['Mexican', 'Italian', 'American', 'Argentine']
  });
});

bot.hear(['help'], (payload, chat) => {
  // Send a text message with buttons
  chat.say({
    text: 'What do you need help with?',
    buttons: [
      { type: 'postback', title: 'Settings', payload: 'HELP_SETTINGS' },
      { type: 'postback', title: 'FAQ', payload: 'HELP_FAQ' },
      { type: 'postback', title: 'Talk to a human', payload: 'HELP_HUMAN' }
    ]
  });
});

bot.hear('image', (payload, chat) => {
  // Send an attachment
  chat.say({
    attachment: 'image',
    url: 'https://i.ytimg.com/vi/6TkFojsmdpw/hqdefault.jpg'
  });
});

bot.start(process.env.PORT || 3000);

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
