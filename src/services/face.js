const axios = require('axios');
require('dotenv').config()
const apiBase = 'https://eastus2.api.cognitive.microsoft.com/face/v1.0/';
axios.defaults.headers.post['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;
axios.defaults.headers.get['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;

exports.detectFace = (message) => {
    return axios.post(apiBase + 'detect?returnFaceId=true&returnFaceLandmarks=false', {
      'url': message.attachments[0].payload.url
    });
}

