const path = require( 'path' )
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../docs/swagger-output.json')

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

    app.use( '/doc', swaggerUi.serve, swaggerUi.setup( swaggerFile, { customCssUrl: '../public/css/swagger-ui.css' }))

}