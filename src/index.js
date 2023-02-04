const express = require( 'express' )
const app = express()
const path = require( 'path' )
const fs = require( 'fs' )
const PORT = process.env.PORT || 3000

let cards_api = fs.readFileSync( path.join( __dirname, './data/cards-api.json' ),'utf8' )
let parsedCardsJSON = JSON.parse( cards_api )
let cards = parsedCardsJSON.cards

let image_urls = fs.readFileSync( path.join( __dirname, './data/image-urls.json' ),'utf8' )
let images = JSON.parse( image_urls )
let UP = 0
let REV = 1


app.get( '/', ( req, res ) =>
{
  res.send( 'Hi Witches!' )
})

app.get( '/calculator', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, '../public/calculator.html' ) )
})

app.get( '/random', ( req, res ) =>
{
  let response = null
  let error = 'none'

  let cardPool = cards

  if( req.query.deck )
  {
    cardPool = []
    let cardNames = req.query.deck.split(",")

    for( let i = 0; i < cardNames.length; i++ )
    {
      for( let j = 0; j < cards.length; j++ )
      {
        if( cardNames[ i ] === cards[ j ].name_short )
        {
          cardPool.push( cards[ j ] )
        }
      }
    }
  }

  if( req.query.deckState )
  {
    cardPool = []
    let state = BigInt( req.query.deckState )

    for( let i = 0; i < cards.length; i++ )
    {
      if( state & BigInt( cards[ i ].id ) )
      {
        cardPool.push( cards[ i ] )
      }
    }
  }

  let card = cardPool[ Math.floor( Math.random() * cardPool.length ) ]

  let reverseChance = 0.5

  if( req.query.reverseChance )
  {
      reverseChance = req.query.reverseChance
  }

  let reversed = ( Math.random() < reverseChance )

  response = formatCard( card, reversed, images )

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.get( '/card', ( req, res ) =>
{
  let response = null
  let error = 'none'
  let card = null;

  if( req.query.name )
  {
    let queryName = req.query.name.toLowerCase().replace( /\s/g, '' )

    for( let i = 0; i < cards.length; i++ )
    {
      let cardName = cards[ i ].name.toLowerCase().replace( /\s/g, '' )

      if( cardName.includes( queryName ) )
      {
        card = cards[ i ]
        break;
      }
    }

    if( card )
    {
      var reversed = false 

      if( req.query.reversed )
      {
        reversed = req.query.reversed
      }

      response = formatCard( card, reversed, images )
    }
    else
    {
      error = `couldn't find card '` + queryName + `'`
    }
  }
  else
  {
    error = 'no card name'
  }

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.get( '/cards', ( req, res ) =>
{
  res.status( 200 ).send({ 
    response: cards,
    error: 'none'
  })
})

app.listen( PORT, () =>
{
  console.log( `Listening on ${ PORT }` )
})

function getImage( key, images, reversed )
{
  // TODO null testing and replace with other image directory if necessary
  return ( reversed ? images[ key ][ REV ] : images[ key ][ UP ] )
}

function getMore( card )
{
  if( card ) 
  {
    return 'https://library.tarotbot.cards/' + card.arcana + '-arcana/' +
      ( card.suit ? 'suit-of-' + card.suit + '/' : card.value + '-' ) + 
      card.name.toLowerCase().replace( /\s/g, '-' )
  }

  return ''
}

function formatCard( card, reversed, images )
{
  return {
    title: card.name,
    description: card.description,
    reversed: reversed,
    keywords: ( reversed ? card.keywords_rev : card.keywords_up ),
    emoji: card.emoji,
    image: getImage( card.name_short, images, reversed ),
    bitmask: card.id,
    more: getMore( card )
  }
}