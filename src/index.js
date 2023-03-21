const express = require( 'express' )
const app = express()
const path = require( 'path' )
const fs = require( 'fs' )
const PORT = process.env.PORT || 3000

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let cards_api = fs.readFileSync( path.join( __dirname, './data/cards-api.json' ),'utf8' )
let parsedCardsJSON = JSON.parse( cards_api )
let cards = parsedCardsJSON.cards

let image_urls = fs.readFileSync( path.join( __dirname, './data/image-urls.json' ),'utf8' )
let images = JSON.parse( image_urls )
let UP = 0
let REV = 1

// let fakeurl = encodeURIComponent( 'localhost:3000/custom' )
// let fakeurl = encodeURIComponent( 'https://tarot-bot-api.vercel.app/custom' )

// console.log( fakeurl )



app.get( '/', ( req, res ) =>
{
  res.send( 'Hi Witches!' )
})

app.get( '/calculator', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, '../public/calculator.html' ) )
})

app.get( '/reading', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, '../public/reading.html' ) )
})

app.get( '/testreading', ( req, res ) =>
{
  res.sendFile( path.join( __dirname, '../public/test.html' ) )
})

// TODO cache?
app.get( '/custom', ( req, res ) =>
{
  res.json( JSON.parse( fs.readFileSync( path.join( __dirname, './data/custom-image-urls.json' ) ) ) )
})

app.get( '/random', async ( req, res ) =>
{
  let response = null
  let error = 'none'

  let cardPool = cards

  if( req.query.deck )
  {
    cardPool = []
    let deck = req.query.deck

    let textState = true

    try
    {
      deck = BigInt( deck )
      textState = false
    }
    catch (error) {}

    if( textState )
    {
      for( let i = 0; i < cards.length; i++ )
      {
        if( deck.indexOf( cards[ i ].name_short ) >= 0 )
        {
          // console.log("adding card: " + cards[ i ].name)

          cardPool.push( cards[ i ] )
        }
      }
    }
    else
    {
      for( let i = 0; i < cards.length; i++ )
      {
        if( deck & BigInt( cards[ i ].id ) )
        {
          // console.log("adding card: " + cards[ i ].name)

          cardPool.push( cards[ i ] )
        }
      }
    }
  }

  let reverseChance = 0.5

  if( req.query.reverseChance )
  {
      reverseChance = req.query.reverseChance
  }

  let reversed = ( Math.random() < reverseChance )

  let card = cardPool[ Math.floor( Math.random() * cardPool.length ) ]

  imageLibrary = images

  if( req.query.images )
  {
    let url = req.query.images

    await fetch(url)
    .then(res => res.json())
    .then(out => {
      // test if url exists
      getImage( card.name_short, out, reversed )

      imageLibrary = out
    })
    .catch();
  }

  response = formatCard( card, reversed, imageLibrary )

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.get( '/card', async ( req, res ) =>
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

      if( cardName.indexOf( queryName ) >= 0 )
      {
        card = cards[ i ]
        break;
      }
    }

    if( card )
    {
      imageLibrary = images

      if( req.query.images )
      {
        let url = req.query.images

        await fetch(url)
        .then(res => res.json())
        .then(out => {
          // test if url exists
          getImage( card.name_short, out, reversed )

          imageLibrary = out
        })
        .catch(err => { console.log( err ) });
      }

      var reversed = false 

      if( req.query.reversed )
      {
        reversed = req.query.reversed
      }

      response = formatCard( card, reversed, imageLibrary )
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

app.get( '/daily', ( req, res ) =>
{
  let response = null
  let error = 'none'

  let seed = 0

  if( req.query.date )
  {
    seed = req.query.date
  }
  else
  {
    let currentDate = new Date()
    seed = ( currentDate.getUTCMonth() + 1 ) * 1000000 + currentDate.getUTCDate() * 10000 + currentDate.getUTCFullYear()
  }

  let index = 0;
  let reversed = false;
  
  try
  {
    let rand = mulberry32( seed )

    index = Math.floor( rand() * cards.length )
    reversed = ( rand() < 0.5 )
  }
  catch (error) {}

  let card = cards[ index ]

  response = formatCard( card, reversed, images )

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

// TODO remove
app.get( '/test', async ( req, res ) =>
{
  let response = null
  let error = 'none'

  let cardPool = []
  let deck = BigInt( 87938498440021695073725n )

  for( let i = 0; i < cards.length; i++ )
  {
    if( deck & BigInt( cards[ i ].id ) )
    {
      // console.log("adding card: " + cards[ i ].name)

      cardPool.push( cards[ i ] )
    }
  }

  // let deck = "ar00,ar02,ar03,ar04,ar05,ar07,ar08,ar11,ar16,ar10,waac,wa02,wa03,wa04,wa05,wa06,wapa,cuac,cu05,cu07,cu08,cupa,cuki,pe03,pe05,pe06,pe07,pe08,pe09,pekn,swac,sw02,sw03,sw04,sw05,sw08,sw10,swqu"

  // for( let i = 0; i < cards.length; i++ )
  // {
  //   if( deck.indexOf( cards[ i ].name_short ) >= 0 )
  //   {
  //     // console.log("adding card: " + cards[ i ].name)

  //     cardPool.push( cards[ i ] )
  //   }
  // }

  let reverseChance = 0.5
  let reversed = ( Math.random() < reverseChance )

  let card = cardPool[ Math.floor( Math.random() * cardPool.length ) ]

  imageLibrary = images

  // let url = 'https%3A%2F%2Ftarot-bot-api.vercel.app%2Fcustom'
  let url = 'https://tarot-bot-api.vercel.app/custom'

  await fetch(url)
  .then(res => res.json())
  .then(out => {
    // test if url exists
    // TODO check if url is empty
    getImage( card.name_short, out, reversed )

    imageLibrary = out
  })
  .catch();

  response = formatCard( card, reversed, imageLibrary )

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.listen( PORT, () =>
{
  console.log( `Listening on ${ PORT }` )
})

// from https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function mulberry32( a )
{
  return function()
  {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul( a ^ a >>> 15, 1 | a );
    t = t + Math.imul( t ^ t >>> 7, 61 | t ) ^ t;
    return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;
  }
}

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
    description: card.desc,
    image: getImage( card.name_short, images, reversed ),
    bitmask: card.id,
    more: getMore( card )
  }
}

module.exports = { app, cards, formatCard }