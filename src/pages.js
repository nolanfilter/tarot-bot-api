const path = require( 'path' )
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../docs/swagger-output.json')
const options = { customCssUrl: '/public/swagger-ui.css' }

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

    app.use( '/doc', swaggerUi.serve )
    app.get( '/doc', swaggerUi.setup( swaggerFile, options ) )

    // app.use( '/doc', function( req, res, next ) {
    //   swaggerFile.host = req.get( 'host' );
    //   req.swaggerDoc = swaggerFile;
    //   next();
    // }, swaggerUi.serve, swaggerUi.setup( swaggerFile, { customCssUrl: '/public/css/swagger-ui.css' } ) )


}