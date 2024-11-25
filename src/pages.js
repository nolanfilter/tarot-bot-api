const path = require( 'path' )
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../docs/swagger-output.json')
const options = { customCssUrl: '/css/swagger-ui.css', customCss: '.swagger-ui .topbar { display: none }' }

module.exports = function (app) {
	
    app.get( '/', ( req, res ) =>
    {
    // #swagger.ignore = true
      res.send( 'Hi Witches!' )
    })
    
    app.get( '/calculator', ( req, res ) =>
    {
    // #swagger.ignore = true
      res.sendFile( path.join( __dirname, '../public/calculator.html' ) )
    })
    
    app.get( '/reading', ( req, res ) =>
    {
    // #swagger.ignore = true
      res.sendFile( path.join( __dirname, '../public/reading.html' ) )
    })
    
    app.get( '/testreading', ( req, res ) =>
    {
    // #swagger.ignore = true
      res.sendFile( path.join( __dirname, '../public/test.html' ) )
    })

    app.get( '/custom', ( req, res ) =>
    {
    // #swagger.ignore = true
      res.sendFile( path.join( __dirname, './data/custom-image-urls.json' ) )
    })

    app.use( '/docs', swaggerUi.serve, swaggerUi.setup( swaggerFile, options ) )
}