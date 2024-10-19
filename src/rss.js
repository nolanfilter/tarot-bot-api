const CronJob = require('cron').CronJob;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require( 'path' )
const fs = require( 'fs' )

module.exports = function (app) {
	
    app.get( '/cron', async ( req, res ) =>
    {
    // #swagger.ignore = true
        const dailyResponse = await fetch( "https://api.tarotbot.cards/daily" );
          
        if( !dailyResponse.ok ) {
          console.log( dailyResponse );
          return;
        }
      
        const daily = await dailyResponse.json();
          
        // console.log("daily: " + JSON.stringify(daily));
          
        let card = daily.response.card;
        
        var image_url = card.image;
      
        if( card.hasOwnProperty( 'image_data' ) ) {
          image_url = card.image_data[ card.image_data.sizes[ card.image_data.sizes.length - 1 ] ].url;
        }
                  
        var dateValue = String( daily.response.date )
        // console.log( dateValue )
        
        dateValue = dateValue.substring( 0, 2 ) + "/" + dateValue.substring( 2, 4 ) + "/" + dateValue.substring( 4, 8 )
        
        // console.log( dateValue )
        
        let date = new Date( dateValue )
        date.setUTCHours(13, 0, 0)
      
        let data = []
        data.push(
          "<?xml version=\"1.0\" encoding=\"UTF-8\" ?>",
          "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\" >",
          "<channel>",
          "<title>Tarot Bot Daily Reading</title>",
          "<atom:link href=\"https://tarot-bot-rss-test.glitch.me/rss\" rel=\"self\" type=\"application/rss+xml\" />",
          "<link>https://www.tarotbot.cards</link>",
          "<description>Card of the Day</description>",
          "<image>",
          "<url>https://api.tarotbot.cards/favicon.png</url>",
          "<title>Tarot Bot Daily Reading</title>",
          "<link>https://www.tarotbot.cards</link>",
          "<width>96</width>",
          "<height>96</height>",
          "</image>",
          "<item>",
          "<pubDate>" + date.toGMTString() + "</pubDate>",
          "<title>Reading for " + daily.response.dateString + "</title>",
          "<link>https://www.tarotbot.cards</link>",
          "<guid isPermaLink=\"false\">tb" + daily.response.date + "</guid>",
          "<description>",
          "<![CDATA[",
          "<h2>" + card.title + ( card.reversed ? " (in reverse)" : "" ) + "</h2>",
          "<h3>" + card.emoji + "</h3>",
          "<img src=\"" + image_url + "\" alt=\"" + card.description + "\" />",
          "<p>" + card.keywords + "</p>",
          "<h2>Description</h2>",
          "<p>" + card.description + "</p>",
          "<h2>Reflection questions</h2>",
          "<ul>",
          "<li>" + card.questions[0] + "</li>",
          "<li>" + card.questions[1] + "</li>",
          "<li>" + card.questions[2] + "</li>",
          "</ul>",
          "]]>",
          "</description>",
          "</item>",
          "</channel>",
          "</rss>"    
        )

        fs.writeFile( path.join( __dirname, '../public/rss.xml' ), data.join( "" ), ( err ) =>
        {
            if( err )
            {
                console.error( err );
            }
            // else
            // {
            //     console.log( "successfully wrote to rss.xml" );
            // }
        })

        res.status( 200 ).send()
    })
    
}