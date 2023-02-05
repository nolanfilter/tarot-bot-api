const { app, cards, formatCard } = require( "../src/index.js" )

export default function handler( req, res )
{
    return res.status( 200 ).send({ 
        response: cards,
        error: 'none'
    })
}