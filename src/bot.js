'use strict';
const BootBot = require('bootbot');
const moment = require('moment');
const face = require('./services/face');
const gMaps = require('./services/gmaps');
const axios = require('axios');
require('dotenv').config()
moment.locale('es');

const bot = new BootBot({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET
});

bot.on('postback:DENUNCIA_CRIMEN', (payload, chat) => {
  chat.say('Hola, comenzaremos el proceso de la denuncia.', {'typing':true}).then(() => {
    chat.conversation((convo) => {
      askForPhoto(convo);
    });
  });
});

bot.on('postback:ATENCION_CRIMEN', (payload, chat) => {
  chat.conversation((convo) => {
    askForHelp(convo);
  });
});

bot.start(process.env.PORT || 3000);

const askForPhoto = (convo) => {
  convo.ask('Envíame una foto tuya o de la persona que realizará la denuncia', async (payload, convo) => {
    try {
      if (payload.message && payload.message.attachments) {
        let faceResp = await face.detectFace(payload.message);

        if (faceResp.data != []) {
          let personResp = await face.identifyPerson(faceResp.data[0].faceId);

          if (personResp.data[0].candidates != []) {
            let infoResp = await face.getPersonInformation(personResp.data[0].candidates[0].personId);

            await convo.say(`Hola, ${infoResp.data.name}.`, {typing: true});
            convo.set('person', infoResp.data);
            askForLocation(convo);
          }
        } else {
          convo.say('No has enviado una foto con un rostro reconocible.').then(() => {
            askForPhoto(convo);
          });
        }
      } else {
        convo.say('No has enviado una foto.').then(() => {
          askForPhoto(convo);
        });
      }
    } catch(error) {
      console.log(error);
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
  convo.ask({
    text: `Envíanos una fecha co formato día/mes/año. Por ejemplo el día de hoy es ${moment().format('DD/MM/YYYY')}`,
    quickReplies: ['Hoy', 'Ayer']
    }, (payload, convo) => {
      let date_txt = payload.message.text;
      let date = moment(date_txt, 'dd/mm/yyyy');
      if (date_txt == 'Hoy') {
        date = moment();
      } else if (date_txt == 'Ayer') {
        date = moment().subtract(1, 'day');
      }
      if (date_txt == 'Hoy' || date_txt == 'Ayer' || moment(date_txt, 'dd/mm/yyyy').isValid()) {
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
  - Ubicación: `, {typing:true}).then(() => {
    convo.say({
      attachment: 'image',
      url: `https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center=${coordinates.lat},${coordinates.long}&zoom=18&markers=${coordinates.lat},${coordinates.long}`,
    }, {typing:true}).then(() => {
      convo.say('Gracias por tu colaboración', {typing:true});
    });

    axios.post(`${process.env.BACKEND_API}/incidents`, {
      person_name: convo.get('person').name,
      person_document_number: convo.get('person').userData,
      datetime: convo.get('date'),
      lat: coordinates.lat,
      long: coordinates.long,
      aditional_information: convo.get('aditionalInformation')
    }).catch(function (error) {
      console.log(error);
    });

    convo.end();
  });
}

const askForHelp = (convo) => {
  convo.ask({
    text: 'Envíanos la ubicación del hecho sucedido',
    quickReplies: [{
        'content_type': 'location'
      }]
  },async (payload, convo) => {
    let coordinates = payload.message.attachments[0].payload.coordinates;
    try {
      let stations = await axios.post(`${process.env.BACKEND_API}/stations/near`, {
        lat: coordinates.lat,
        long: coordinates.long,
      });

      // let response = await gMaps.getDistanceMatrix(coordinates, stations.data);
      await convo.say(`Estamos calculando la comisaria mas cercana`, {typing:true});

      let directions = await gMaps.getDirections(coordinates, stations.data[0]);

      let encRoute = directions.data.routes[0].overview_polyline.points;

      convo.say({
        attachment: 'image',
        url: `https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&zoom=15&path=enc%3A${encRoute}`,
      }, {typing:true});

    } catch(error) {
      console.log(error);
    }
  });
}