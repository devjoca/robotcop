'use strict';
const BootBot = require('bootbot');
const face = require('./services/face');
require('dotenv').config()

const bot = new BootBot({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECET
});

bot.on('postback:DENUNCIA_CRIMEN', (payload, chat) => {
  chat.say('Hola, comenzaremos el proceso de la denuncia.', {'typing':true}).then(() => {
    chat.conversation((convo) => {
      askForPhoto(convo);
    });
  });
});

bot.start(process.env.PORT || 3000);

const askForPhoto = (convo) => {
  convo.ask('Envíame una foto tuya o de la persona que realizará la denuncia', (payload, convo) => {
    if(payload.message.attachments) {
      face.detectFace(payload.message);
    } else {
      convo.say('No has enviado una foto.').then(() => {
        askForPhoto(convo);
      })
    }
  });
}

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
