const axios = require('axios');
require('dotenv').config()

exports.getDistanceMatrix = (origin, end) => {
  return axios.get(`http://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.long}&destinations=${end.lat},${end.long}&languages=es`);
}

exports.getDirections = (origin, destination) => {
  return axios.get(`http://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.long}&destination=${destination.lat},${destination.long}&languages=es&key=${process.env.GMAPS_KEY}`);
}