const axios = require('axios');
require('dotenv').config();

exports.validateInformation = (data) => {
    return axios.post(`${process.env.BACKEND_API}/person/search`, {
        dni: data.dni,
        birthday: data.birthday,
    });
}

exports.getByFaceId = (faceId) => {
    return axios.get(`${process.env.BACKEND_API}/person/${faceId}`);
}