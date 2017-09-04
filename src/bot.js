'use strict';
const BootBot = require('bootbot');
const moment = require('moment');
const face = require('./services/face');
require('dotenv').config()
moment.locale('es');

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
    if (payload.message.attachments) {
      face.detectFace(payload.message).then((response) => {
        if (response.data != []) {
          face.identifyPerson(response.data[0].faceId).then((response) => {
            if (response.data[0].candidates != []) {
              face.getPersonInformation(response.data[0].candidates[0].personId).then((response) => {
                convo.say(`Hola, ${response.data.name}.`).then(() => {
                  convo.set('person', response.data);
                  askForLocation(convo);
                });
              });
            }
          });
        } else {
          convo.say('No has enviado una foto con un rostro reconocible.').then(() => {
            askForPhoto(convo);
          });
        }
      });
    } else {
      convo.say('No has enviado una foto.').then(() => {
        askForPhoto(convo);
      });
    }
  });
}

const askForLocation = (convo) => {
  convo.ask({
    text: 'Ahora envíanos la ubicación del hecho sucedido',
    quickReplies: [{
        'content_type': 'location'
      }]
  }, (payload, convo) => {
      convo.set('location', payload.message.attachments[0].payload.coordinates);
      askForDate(convo);
  });
}

const askForDate = (convo) => {
  convo.ask(`Envíanos una fecha co formato día/mes/año. Por ejemplo el día de hoy es ${moment().format('DD/MM/YYYY')}`, (payload, convo) => {
      let date = payload.message.text;
      date = moment(date, 'dd/mm/yyyy');
      if (moment(date, 'dd/mm/yyyy').isValid()) {
        convo.say(`La fecha escogida es ${date.format('LL')}`).then(() => {
          convo.set('date', date.format('X'));
          askForAditionalInformation(convo);
        });
      } else {
        convo.say(`Hubo un error con la fecha ingresada.`).then(() => {
          askForDate(convo);
        });
      }
  });
}

const askForAditionalInformation = (convo) => {
  convo.ask(`Deseas agregar información adicional?`, (payload, convo) => {
    let coordinates = convo.get('location');
    convo.set('aditionalInformation', payload.message.text);
    sendSummary(convo);
  });
}

const sendSummary = (convo) => {
  let date = moment.unix(convo.get('date'));
  let coordinates = convo.get('location');

  convo.say(`La información que se envío es la siguiente:
  - Denunciante: ${convo.get('person').name}
  - Fecha: ${date.format('LL')}
  - Información adicional: ${convo.get('aditionalInformation')}
  - Ubicación: `).then(() => {
    convo.say({
      attachment: 'image',
      url: `https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center=${coordinates.lat},${coordinates.long}&zoom=18&markers=${coordinates.lat},${coordinates.long}`,
    });

    convo.end();
  });
}