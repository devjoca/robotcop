const axios = require('axios');
require('dotenv').config()
const apiBase = 'https://eastus2.api.cognitive.microsoft.com/face/v1.0';
axios.defaults.headers.post['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;
axios.defaults.headers.get['Ocp-Apim-Subscription-Key'] = process.env.AZURE_KEY;

exports.detectFace = (message) => {
    return axios.post(apiBase + '/detect?returnFaceId=true&returnFaceLandmarks=false', {
      'url': message.attachments[0].payload.url
    });
}

exports.identifyPerson = (faceId) => {
    return axios.post(apiBase + '/identify', {
        'personGroupId': 'person-data',
        'faceIds': [faceId],
        'maxNumOfCandidatesReturned': 1,
        'confidenceThreshold': 0.5
    });
}

exports.getPersonInformation = (personId) => {
    return  axios.get(`${apiBase}/persongroups/person-data/persons/${personId}`);
}

