const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    version: '1.0.0',
    title: 'Tarot Bot API',
    description: 'Everything you need for digital Tarot readings',
  },
  host: 'tarot-bot-api.vercel.app',
  schemes: [],
};

const outputFile = '../docs/swagger-output.json';
const endpointsFiles = ['./index.js'];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./index.js')
})