if( process.env.NODE_ENV !== 'production' ) { 
  require('dotenv').config(); 
} 

const express = require( 'express' )
const app = express()
const path = require( 'path' )
const fs = require( 'fs' )

const sharp = require("sharp");
const { joinImages } = require("join-images");

const PORT = process.env.PORT || 3000

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

let cards_api = fs.readFileSync( path.join( __dirname, './data/cards-api.json' ),'utf8' )
let parsedCardsJSON = JSON.parse( cards_api )
let cards = parsedCardsJSON.cards

let rws_image_urls = fs.readFileSync( path.join( __dirname, './data/image-urls.json' ),'utf8' )
let rws_images = JSON.parse( rws_image_urls )

let tb_image_urls = fs.readFileSync( path.join( __dirname, './data/custom-image-urls.json' ),'utf8' )
let tb_images = JSON.parse( tb_image_urls )


// let fakeurl = encodeURIComponent( 'localhost:3000/custom' )
// let fakeurl = encodeURIComponent( 'https://tarot-bot-api.vercel.app/custom' )

// console.log( fakeurl )

app.use( '/css', express.static( path.join( __dirname, './css' ) ) )

app.use( '/favicon.ico', express.static( path.join( __dirname, '../public/images/favicon.ico' ) ) )
app.use( '/favicon.png', express.static( path.join( __dirname, '../public/images/favicon.png' ) ) )

// TODO cache?
// app.get( '/custom', ( req, res ) =>
// {
// // #swagger.ignore = true
//   res.json( JSON.parse( fs.readFileSync( path.join( __dirname, './data/custom-image-urls.json' ) ) ) )
// })

app.get( '/random', async ( req, res ) =>
{
// #swagger.description = 'Returns a random card'
  let response = null
  let error = null
  
  // let start = Date.now();
  // console.log( 'start: ' + start );

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
  
  let card = cardPool[ Math.floor( Math.random() * cardPool.length ) ]

//  #swagger.parameters['images'] = { description: 'The (encoded uri component) url of a formatted json file with urls for card images. Used to change the images that tarot bot returns' }
  imageLibrary = await getImageLibrary( req.query.images, card.name_short, reversed );

  response = formatCard( card, reversed, imageLibrary )

  // let end = Date.now();

  // console.log( 'end: ' + end );
  // console.log( 'delta: ' + ( end - start ) );

  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})

app.get( '/card', async ( req, res ) =>
{
// #swagger.description = 'Returns a specific card'
  let response = null
  let error = null
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
//  #swagger.parameters['images'] = { description: 'The (encoded uri component) url of a formatted json file with urls for card images. Used to change the images that tarot bot returns' }
      imageLibrary = await getImageLibrary( req.query.images, card.name_short, reversed );

      var reversed = false 

      if( req.query.reversed )
      {
//  #swagger.parameters['reversed'] = { description: 'Return card as reversed. Default false' }
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
// #swagger.description = 'Returns all cards'
  res.status( 200 ).send({ 
    response: cards,
    error: null
  })
})

// TODO cleanup
const monthNames = [
  'Smarch', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

app.get( '/daily', async ( req, res ) =>
{
// #swagger.description = 'Returns a unique Tarot Card for the given date'
  let response = null
  let error = null

  let seed = 0

  if( req.query.date )
  {
//  #swagger.parameters['date'] = { description: 'the day the returned card will represent in MMDDYYYY format. Default today' }
    seed = req.query.date
  }

  response = getDailyCardResponse( seed )

  res.set('Cache-control', 'public, max-age=43200')
  res.status( 200 ).send({ 
      response: response,
      error: error
  })
})


app.get( '/spread', async ( req, res ) =>
{
  let url = ''
  let response = []
  let error = null
  let start = Date.now();

  let cardPool = [...cards];

  imageLibrary = tb_images

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

  let layout = '900,530,0,0,300,0,600,0'

  // TODO error checking
  if( req.query.format )
  {
    layout = req.query.format;
  }

  let coordinates = layout.split(',').map(Number);

  let numCards = ( coordinates.length / 2 ) - 1;

  let id = layout;

  // TODO hardcoded
  // populate card data
  for( let i = 0; i < numCards; i++ )
  {
    let index = Math.floor( Math.random() * cardPool.length );
    // let index = i;
    let card = cardPool[ index ];
    let reversed = Math.random() < 0.5;
    // let reversed = false;

    response.push( formatCard( card, reversed, imageLibrary ) );
    cardPool.splice( index, 1 );

    id += ',' + card.name_short + ',' + reversed;
  }

  // console.log(JSON.stringify(response));

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
    let imageData = []

    let width = coordinates[0];
    let height = coordinates[1];

    let currentX = 0;
    let currentY = 0;

    // TODO error checking
    for( let i = 0; i < numCards; i++ )
    {
      // console.log( JSON.stringify( response[ i ] ) );

      let url = response[ i ].image;

      if( !url )
      {
        url = getImage( response[ i ].id, rws_images, response[ i ].reversed );
      }

      // TODO only resize if size is wrong
      let fimg = await fetch( url );
      let fimgb = await fimg.buffer();
      let simg = sharp( fimgb );

      if( response[ i ].width != 300 || response[ i ].height != 530 )
      {
        simg = simg.resize( 300,530 );
      }

      let src = await simg.toBuffer();

      imageData.push({
        src: src,
        offsetX: coordinates[ i * 2 + 2 ],
        offsetY: coordinates[ i * 2 + 3 ] - currentY,
      })

      currentY = coordinates[ i * 2 + 3 ] + 530;
    }

    if( currentY < height )
    {
      imageData.push({
        src: path.join( __dirname, './data/empty.png' ),
        offsetX: 0,
        offsetY: height - currentY - 1,
      })
    }

    // build images
    await joinImages(
      imageData,
      {
        color: { alpha: 0, b: 0, g: 0, r: 0 }
    })
    .then((img) => {
      // console.log(data);
      // base64Data = data.replace(/^data:image\/png;base64,/, "");
      // console.log(base64Data);
      return img.png().toBuffer();
    })
    .then(data => imageData = data )
    .catch((e) => console.log(e));

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
      await fetch("https://builder.io/api/v1/write/spread", {
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

app.get( '/archive', async ( req, res ) =>
{
// #swagger.description = 'Returns past Daily readings'
  let error = null

  let offset = 0
  let limit = 100

  if( req.query.offset )
  {
//  #swagger.parameters['offset'] = { description: 'the number of days in the past to start counting back from. Default 0' }
    offset = req.query.offset
  }

  if( req.query.limit )
  {
//  #swagger.parameters['limit'] = { description: 'the maximum number of daily readings to return. Default 100, max 1000' }
    limit = Math.min( req.query.limit, 1000 )
  }

  let readings = []
  let card = {}

  let seed = 0
  let count = 0
  let date = new Date()
  date.setDate(date.getDate() - offset)
  let dateString = ''

  while( count < limit )
  {
    dateString = date.toLocaleDateString("en-US")
    seed = dateString.replace(/\//g, '')
  
    let index = 0;
    let reversed = false;
    
    try
    {
      let rand = mulberry32( seed )
  
      index = Math.floor( rand() * cards.length )
      reversed = ( rand() < 0.5 )
    }
    catch (error) {}

    card = cards[ index ]

    readings.push({
      image: getImage( card.name_short, tb_images, reversed ),
      more: getMore( card, tb_images ),
      date: dateString
    })

    date.setDate(date.getDate() - 1);

    count++;
  }

  res.status( 200 ).send({ 
      response: {
        readings: readings,
        length: readings.length,
      },
      error: error
  })
})

// TODO remove
app.get( '/test', async ( req, res ) =>
{
// #swagger.ignore = true
  let response = null
  let error = null

  let cardPool = cards

  // let cardPool = []
  // let deck = BigInt( 94446750484400694058941n )

  // for( let i = 0; i < cards.length; i++ )
  // {
  //   if( deck & BigInt( cards[ i ].id ) )
  //   {
  //     // console.log("adding card: " + cards[ i ].name)

  //     cardPool.push( cards[ i ] )
  //   }
  // }

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

  imageLibrary = tb_images

  // let url = 'https%3A%2F%2Ftarot-bot-api.vercel.app%2Fcustom'
  // let url = 'https://tarot-bot-api.vercel.app/custom'

  // await fetch(url)
  // .then(res => res.json())
  // .then(out => {
  //   // test if url exists
  //   // TODO check if url is empty
  //   getImage( card.name_short, out, reversed )

  //   imageLibrary = out
  // })
  // .catch();

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

async function getImageLibrary( images, cardName, reversed )
{
  if( images )
  {
    let macro = images.toLowerCase();

    if( macro === "rws" || macro === "rider-waite" || macro === "rider-waite-smith" )
    {
      return rws_images;
    }

    if( macro === "tarotbot" || macro === "tb" )
    {
      return tb_images;
    }

    // default
    let imageLibrary = rws_images;
    
    await fetch(images)
    .then(res => res.json())
    .then(out => {
      // test if url exists
      if( out && out[ cardName ][ reversed ? "reversed" : "upright" ] )
      {
        imageLibrary = out;
      }
    })
    .catch(err => { console.log( err ) });

    return imageLibrary;
  }

  // default
  return rws_images;
}

function getDescription( key, images )
{
  // TODO null testing and replace with other image directory if necessary
  return images[ key ].description
}

function getImage( key, images, reversed )
{
  // TODO null testing and replace with other image directory if necessary
  return ( reversed ? images[ key ].reversed : images[ key ].upright )
}

function getWidth( key, images )
{
  // TODO null testing and replace with other image directory if necessary
  return images[ key ].width
}

function getHeight( key, images )
{
  // TODO null testing and replace with other image directory if necessary
  return images[ key ].height
}

function getMore( card, images )
{
  if( card ) 
  {
    if( images.tb )
    {
      return 'https://tarotbot.cards/' + 
        ( card.suit ? 'suit-of-' + card.suit + '/' : 'major-arcana/' ) + 
        card.name.toLowerCase().replace( /\s/g, '-' )
    }
    else
    {
      return 'https://rws.tarotbot.cards/' + card.arcana + '-arcana/' +
        ( card.suit ? 'suit-of-' + card.suit + '/' : card.value + '-' ) + 
        card.name.toLowerCase().replace( /\s/g, '-' )
    }
  }

  return ''
}

function getHasSizes( key, images )
{
  if( images && images[ key ] )
  {
    return images[ key ][ 'sizes' ]
  }

  return false
}

function getImageData( key, images, reversed )
{
  // TODO so much error checking
  if( images && images[ key ] && images[ key ].sizes )
  {
    let image_data = {
      sizes: []
    }
    
    let sizes = images[ key ].sizes.sort((a,b) => a.width - b.width);

    for( let i = 0; i < sizes.length; i++ )
    {
      let size = sizes[ i ].size

      image_data.sizes.push( size )
      image_data[ size ] = {
        url: ( reversed ? sizes[ i ].reversed : sizes[ i ].upright ),
        width: sizes[ i ].width,
        height: sizes[ i ].height
      }
    }

    return image_data
  }

  return []
}

function getDailyCardResponse( seed )
{
  if( !seed || seed === 0 )
  {
    seed = (new Date()).toLocaleDateString("en-US").replace(/\//g, '')
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

  let card = formatCard( cards[ index ], reversed, tb_images )
  
  let dateString = '' + ( Math.floor( seed / 10000 ) % 100 ) + ' '
                      + monthNames[ Math.floor( seed / 1000000 ) ];

  return {
    card: card,
    date: seed,
    dateString: dateString
  }
}

function formatCard( card, reversed, images )
{
  return {
    title: card.name,
    reversed: reversed,
    keywords: ( reversed ? card.keywords_rev : card.keywords_up ),
    emoji: card.emoji,
    meaning: ( reversed ? card.meaning_rev : card.meaning_up ),
    description: getDescription( card.name_short, images ),
    image: getImage( card.name_short, images, reversed ),
    width: getWidth( card.name_short, images ),
    height: getHeight( card.name_short, images ),
    ...getHasSizes( card.name_short, images ) && { image_data: getImageData( card.name_short, images, reversed ) },
    questions: [ card.question_0, card.question_1, card.question_2 ],
    id: card.name_short,
    bitmask: card.id,
    more: getMore( card, images )
  }
}

require('./pages.js')(app)
require('./rss.js')(app, getDailyCardResponse)

module.exports = { app, cards, formatCard }