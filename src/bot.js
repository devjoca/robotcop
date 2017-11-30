'use strict';
const BootBot = require('bootbot');
const moment = require('moment');
const face = require('./services/face');
const gMaps = require('./services/gmaps');
const axios = require('axios');
const backend = require('./services/backend');
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
      askForDocument(convo);
    });
  });
});

bot.on('postback:ATENCION_CRIMEN', (payload, chat) => {
  chat.conversation((convo) => {
    askForDetails(convo);
  });
});

bot.start(process.env.PORT || 3000);

const askForPhoto = (convo) => {
  convo.ask('Envíame una foto tuya o de la persona que realizará la denuncia', async (payload, convo) => {
    try {
      if (payload.message && payload.message.attachments) {
        const faceResp = await face.detectFace(payload.message);
        if (faceResp.data.length > 0) {
          const personResp = await face.identifyPerson(faceResp.data[0].faceId);

          if (personResp.data[0].candidates.length > 0) {
            const infoResp = await backend.getByFaceId(personResp.data[0].candidates[0].personId);

            if(infoResp.data.dni != convo.get('document'))
            {
              convo.say('La información asociada a la foto no coincide con el documento enviado. Intenta de nuevo.').then(() => {
                askForPhoto(convo);
              });
            }
            await convo.say(`Hola, ${infoResp.data.name}.`, {typing: true});
            convo.set('person', infoResp.data);
            askForLocation(convo);
          } else {
            askForBirthday(convo);
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
    text: `Envíanos la fecha del suceso con el formato día/mes/año. Por ejemplo el día de hoy es ${moment().format('DD/MM/YYYY')}`,
    quickReplies: ['Hoy', 'Ayer']
    }, (payload, convo) => {
      const date_txt = payload.message.text;
      let date = moment(date_txt, 'dd/mm/yyyy');

      if (date_txt == 'Hoy') {
        date = moment();
      } else if (date_txt == 'Ayer') {
        date = moment().subtract(1, 'day');
      }
      if (date_txt == 'Hoy' || date_txt == 'Ayer' || moment(date_txt, 'dd/mm/yyyy').isValid()) {
        convo.say(`La fecha escogida es ${date.format('LL')}`).then(() => {
          convo.set('date', date.format('X'));
          askForDenouncedPersonDetails(convo);
        });
      } else {
        convo.say(`Hubo un error con la fecha ingresada.`).then(() => {
          askForDate(convo);
        });
      }
  });
}

const askForEmail = (convo) => {
  convo.ask(`Envíanos tu correo electrónico para ponernos en contacto`, (payload, convo) => {
    convo.set('email', payload.message.text);
    askForPhoto(convo);
  });
}

const askForDenouncedPersonDetails = (convo) => {
  convo.ask(`Bríndanos detalles de la persona denunciada`, (payload, convo) => {
    convo.set('denouncePersonDetails', payload.message.text);
    askForAditionalInformation(convo);
  });
}

const askForAditionalInformation = (convo) => {
  convo.ask(`Detállanos el hecho con tus propias palabras, incluya toda la información posible.`, (payload, convo) => {
    const coordinates = convo.get('location');
    convo.set('aditionalInformation', payload.message.text);
    sendSummary(convo);
  });
}

const sendSummary = (convo) => {
  const date = moment.unix(convo.get('date'));
  const coordinates = convo.get('location');

  convo.say(`La información que se envío es la siguiente:
  - Denunciante: ${convo.get('person').name} ${convo.get('person').lastname}
  - Número de documento: ${convo.get('document')}
  - Correo de contacto: ${convo.get('email')}
  - Descripción de la persona involucrada: ${convo.get('denouncePersonDetails')}
  - Fecha: ${date.format('LL')}
  - Narrativa: ${convo.get('aditionalInformation')}
  - Ubicación: `, {typing:true}).then(() => {
    convo.say({
      attachment: 'image',
      url: `https://maps.googleapis.com/maps/api/staticmap?size=764x400&center=${coordinates.lat},${coordinates.long}&zoom=18&markers=${coordinates.lat},${coordinates.long}`,
    }, {typing:true}).then(() => {
      convo.say('Gracias por tu colaboración', {typing:true});
    });

    axios.post(`${process.env.BACKEND_API}/incidents`, {
      person_id: convo.get('person').id,
      email: convo.get('email'),
      denouncePersonDetails: convo.get('denouncePersonDetails'),
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

const askForDocument = (convo) => {
  convo.ask(`Envíanos tu número de documento de identidad`, (payload,convo) => {
    convo.set('document', payload.message.text);
    askForEmail(convo);
  });
}

const askForBirthday = (convo) => {
  convo.ask(`No se pudo identificar a la persona, brindanos tu fecha de nacimiento con el formati día/mes/año.
    Por ejemplo el día de hoy es ${moment().format('DD/MM/YYYY')}:`, async (payload,convo) => {
    const date = moment(payload.message.text, 'DD/MM/YYYY');

    if (moment(payload.message.text, 'DD/MM/YYYY').isValid()) {
      try {
        const person = await backend.validateInformation({dni: convo.get('document'), birthday: date.format('YYYY-MM-DD')});
        convo.set('person', person.data);
        await convo.say(`Hola, ${person.data.name}.`, {typing: true});
        askForLocation(convo);
      } catch(error) {
        await convo.say(`Lo sentimos, no pudimos encontrar los datos del denunciante.`);
        convo.end();
      }
    } else {
      askForBirthday(convo);
    }
  });
}

const askForLocationHelp = (convo) => {
  convo.ask({
    text: 'Envíanos la ubicación del hecho sucedido',
    quickReplies: [{
        'content_type': 'location'
      }]
  }, async (payload, convo) => {
    const coordinates = payload.message.attachments[0].payload.coordinates;
    try {
      const stations = await axios.post(`${process.env.BACKEND_API}/stations/near`, {
        lat: coordinates.lat,
        long: coordinates.long,
      });

      await convo.say(`Estamos calculando la comisaria mas cercana`, {typing: true});
      const directions = await gMaps.getDirections(coordinates, stations.data[0]);
      const distance = await gMaps.getDistanceMatrix(coordinates, stations.data[0]);

      await convo.say(`-Nombre: ${stations.data[0].name}`, {typing: true});
      await convo.say(`-Ubicación: ${distance.data.destination_addresses[0]}`, {typing: true});
      await convo.say(`-Tiempo estimado de llegada: ${distance.data.rows[0].elements[0].duration.text}`, {typing: true});
      const encRoute = directions.data.routes[0].overview_polyline.points;

      convo.say({
        attachment: 'image',
        url: `https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&zoom=15&markers=${stations.data[0].lat},${stations.data[0].long}&path=enc%3A${encRoute}`,
      }, {typing:true});

      await backend.saveCriminalActReport({
        lat: coordinates.lat,
        long: coordinates.long,
        details: convo.get('details'),
        stationId: stations.data[0].id,
      });

      convo.end();
    } catch(error) {
      convo.say(`Tuvimos un incoveniente, intenta más tarde.`);
      convo.end();
      console.log(error);
    }
  });
}

const askForDetails = (convo) => {
  convo.ask(`Ingrese los detalles del hecho sucedido`, (payload, convo) => {
    convo.set('details', payload.message.text);
    askForLocationHelp(convo);
  });
}