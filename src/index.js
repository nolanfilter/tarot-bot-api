if( process.env.NODE_ENV !== 'production' ) { 
  require('dotenv').config(); 
} 

const express = require( 'express' )
const app = express()
const path = require( 'path' )
const fs = require( 'fs' )
// const mergeImages = require("merge-images");
const { Canvas, Image } = require('canvas');
const PORT = process.env.PORT || 3000

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let cards_api = fs.readFileSync( path.join( __dirname, './data/cards-api.json' ),'utf8' )
let parsedCardsJSON = JSON.parse( cards_api )
let cards = parsedCardsJSON.cards

let image_urls = fs.readFileSync( path.join( __dirname, './data/image-urls.json' ),'utf8' )
let images = JSON.parse( image_urls )
let UP = 0
let REV = 1
let DESC = 2

// let fakeurl = encodeURIComponent( 'localhost:3000/custom' )
// let fakeurl = encodeURIComponent( 'https://tarot-bot-api.vercel.app/custom' )

// console.log( fakeurl )

app.use( '/css', express.static( path.join( __dirname, './css' ) ) )

// TODO cache?
app.get( '/custom', ( req, res ) =>
{
// #swagger.ignore = true
  res.json( JSON.parse( fs.readFileSync( path.join( __dirname, './data/custom-image-urls.json' ) ) ) )
})

app.get( '/random', async ( req, res ) =>
{
// #swagger.description = 'Returns a random card'
  let response = null
  let error = 'none'

  let cardPool = cards

  if( req.query.deck )
  {
//  #swagger.parameters['deck'] = { description: 'Bit mask or string representation of subset of deck. Used to limit deck to major or minor arcana only, or remove cards from the deck as they’re drawn.' }
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
//  #swagger.parameters['reverseChance'] = { description: 'Percent chance the card will be reversed. Default 0.5' }
      reverseChance = req.query.reverseChance
  }

  let reversed = ( Math.random() < reverseChance )

  // TODO add query parameter?
  let reflectionIndex = Math.floor( Math.random() * 3 );
  
  let card = cardPool[ Math.floor( Math.random() * cardPool.length ) ]

  imageLibrary = images

  if( req.query.images )
  {
//  #swagger.parameters['images'] = { description: 'The (encoded uri component) url of a formatted json file with urls for card images. Used to change the images that tarot bot returns' }
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

  response = formatCard( card, reversed, imageLibrary, reflectionIndex )

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.get( '/card', async ( req, res ) =>
{
// #swagger.description = 'Returns a specific card'
  let response = null
  let error = 'none'
  let card = null;

  if( req.query.name )
  {
//  #swagger.parameters['name'] = { description: 'String representation of the card' }
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
//  #swagger.parameters['images'] = { description: 'The (encoded uri component) url of a formatted json file with urls for card images. Used to change the images that tarot bot returns' }
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
//  #swagger.parameters['reversed'] = { description: 'Return card as reversed. Default false' }
        reversed = req.query.reversed
      }

      // TODO add query parameter?
      let reflectionIndex = Math.floor( Math.random() * 3 );

      response = formatCard( card, reversed, imageLibrary, reflectionIndex )
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
// #swagger.description = 'Returns all cards'
  res.status( 200 ).send({ 
    response: cards,
    error: 'none'
  })
})

app.get( '/daily', ( req, res ) =>
{
// #swagger.description = 'Returns a unique Tarot Card for the given date'
  let response = null
  let error = 'none'

  let seed = 0

  if( req.query.date )
  {
//  #swagger.parameters['date'] = { description: 'the day the returned card will represent in MMDDYYYY format. Default today' }
    seed = req.query.date
  }
  else
  {
    let currentDate = new Date()
    seed = ( currentDate.getUTCMonth() + 1 ) * 1000000 + currentDate.getUTCDate() * 10000 + currentDate.getUTCFullYear()
  }

  let index = 0;
  let reversed = false;
  let reflectionIndex = 0;
  
  try
  {
    let rand = mulberry32( seed )

    index = Math.floor( rand() * cards.length )
    reversed = ( rand() < 0.5 )
    reflectionIndex = Math.floor( rand() * 3 );
  }
  catch (error) {}

  let card = cards[ index ]

  response = formatCard( card, reversed, images, reflectionIndex )

  res.status( 200 ).send({ 
      response: {
        card: response,
        date: seed
      },
      error: error
  })
})

/*
app.get( '/spread', async ( req, res ) =>
{
  let url = ''
  let response = []
  let error = 'none'
  let start = Date.now();

  let cardPool = [...cards];

  imageLibrary = images

  // await fetch('https://tarot-bot-api.vercel.app/custom')
  // .then(res => res.json())
  // .then(out => {
  //   // test if url exists
  //   // TODO check if url is empty
  //   // hardcoded check, should just incorporate deck ugh
  //   getImage( 'ar00', out, false )

  //   imageLibrary = out
  // })
  // .catch();

  // TODO hardcoded
  // populate card data
  for( let i = 0; i < 3; i++ )
  {
    let index = Math.floor( Math.random() * cardPool.length );
    // let index = i;
    let card = cardPool[ index ];
    let reversed = Math.random() < 0.5;
    // let reversed = false;
    let reflectionIndex = Math.floor( Math.random() * 3 );

    response.push( formatCard( card, reversed, imageLibrary, reflectionIndex ) );
    cardPool.splice( index, 1 );
  }

  // console.log(JSON.stringify(response));

  // TODO hardcoded
  let id = '900,530,0,0,300,0,600,0,' + response[0].id + ',' + response[0].reversed + ',' + response[1].id + ',' + response[1].reversed + ',' + response[2].id + ',' + response[2].reversed;

  // console.log(id);

  await fetch("https://cdn.builder.io/api/v2/content/spread?apiKey=" + process.env.BuilderIO_API_Public_Key + "&limit=1&query.name.$eq=" + encodeURIComponent(id))
  .then(res => {
    return res.json();
  }).then(resp => {
    // console.log(resp);
    // TODO so much error checking
    if( resp && resp.results.length > 0 )
    {
      url = resp.results[0].data.spreadImage;
    }
  }).catch((e) => console.log(e));

  // console.log("url after search:" + url);

  if( !url )
  {
    let imageData = ''

    // TODO hardcoded
    // build images
    await mergeImages([
      { src: response[0].image, x: 0, y: 0 },
      { src: response[1].image, x: 300, y: 0 },
      { src: response[2].image, x: 600, y: 0 },
      ], {
      width: 900,
      height: 530,
      Canvas: Canvas,
      Image: Image,
    })
    .then(data => {
      // console.log(data);
      base64Data = data.replace(/^data:image\/png;base64,/, "");
      // console.log(base64Data);
      imageData = Buffer.from(base64Data, 'base64');
    }).catch((e) => console.log(e));

    // TODO replace with imgur?
    // upload image to builder.io
    await fetch("https://builder.io/api/v1/upload", {
      method: "POST",
      body: imageData,
      headers: {
       "Authorization": "Bearer " + process.env.BuilderIO_API_Private_Key, 
       "Content-Type": "image/png"
      },
    }).then(res => {
        return res.json();
    }).then(resp => {
      //  console.log(resp);
      url = resp.url;
    }).catch((e) => console.log(e));

    // console.log("url after upload:" + url);

    if( url ) {
      // write metadata to builder.io for searchability
      fetch("https://builder.io/api/v1/write/spread", {
        method: "POST",
        body: JSON.stringify({
        "name": id,
        "data": {
          "spreadImage": url
        },
        "published": "published"
      }),
        headers: {
        "Authorization": "Bearer " + process.env.BuilderIO_API_Private_Key,
        "Content-Type": "application/json"
        },
      }).then(res => {
            return res.json();
      }).then(resp => {
          // console.log(resp);
      }).catch((e) => console.log(e));
    }
  }

  res.status( 200 ).send({ 
      response: {
        image: url,
        cards: response,
        // TODO remove
        time: ( Date.now() - start )
      },
      error: error
  })
})
*/

// TODO remove
app.get( '/test', async ( req, res ) =>
{
// #swagger.ignore = true
  let response = null
  let error = 'none'

  let cardPool = []
  let deck = BigInt( 94446750484400694058941n )

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
  
  // TODO add query parameter?
  let reflectionIndex = Math.floor( Math.random() * 3 );

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

  response = formatCard( card, reversed, imageLibrary, reflectionIndex )

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

function getDescription( key, images )
{
  // TODO null testing and replace with other image directory if necessary
  return images[ key ][ DESC ]
}

function getImage( key, images, reversed )
{
  // TODO null testing and replace with other image directory if necessary
  return ( reversed ? images[ key ][ REV ] : images[ key ][ UP ] )
}

function getReflection( card, reflectionIndex )
{
  if( card )
  {
    return card[ 'question_' + reflectionIndex ];
  }

  return ''
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

function formatCard( card, reversed, images, reflectionIndex )
{
  return {
    title: card.name,
    reversed: reversed,
    keywords: ( reversed ? card.keywords_rev : card.keywords_up ),
    emoji: card.emoji,
    description: getDescription( card.name_short, images ),
    image: getImage( card.name_short, images, reversed ),
    reflection: getReflection( card, reflectionIndex ),
    id: card.name_short,
    bitmask: card.id,
    more: getMore( card )
  }
}

require('./pages.js')(app)

module.exports = { app, cards, formatCard }