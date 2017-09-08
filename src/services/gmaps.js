const axios = require('axios');

exports.getDistanceMatrix = (origin, points) => {
    let destinations = points.reduce((str, station) => {
      return  `${str}|${station.lat},${station.long}`;
    }, '');
    destinations = destinations.substr(1);

    return axios.get(`http://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.long}&destinations=${destinations}`);
}

exports.getDirections = (origin, destination) => {
  return axios.get(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.long}&destination=${destination.lat},${destination.long}`);
}