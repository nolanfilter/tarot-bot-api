let rss = ''

module.exports = function (app, getDailyCardResponse) {
	
    app.get( '/rss', ( req, res ) =>
    {
    // #swagger.ignore = true
        if( !rss )
        {
            refreshRSS()
        }

        res.set('Content-Type', 'text/xml')
        res.send(rss)
    })

    app.get( '/cron', async ( req, res ) =>
    {
    // #swagger.ignore = true
        refreshRSS()
        
        res.status( 200 ).send()
    })

    function refreshRSS()
    { 
        var seed = 0

        if( (new Date()).getUTCHours() < 13 )
        {
            var yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            seed = yesterday.toLocaleDateString("en-US").replace(/\//g, '')
        }

        const daily = getDailyCardResponse( seed )
            
        // console.log("daily: " + JSON.stringify(daily));
            
        let card = daily.card;
        
        var image_url = card.image;
        
        if( card.hasOwnProperty( 'image_data' ) ) {
            image_url = card.image_data[ card.image_data.sizes[ card.image_data.sizes.length - 1 ] ].url;
        }
                    
        var dateValue = String( daily.date )
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
            "<title>Reading for " + daily.dateString + "</title>",
            "<link>https://www.tarotbot.cards/?date=" + date.toISOString().slice(0,10) + "</link>",
            "<guid isPermaLink=\"false\">tb" + daily.date + "</guid>",
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

        rss = data.join( "" )

        // console.log( 'wrote to rss' )
    }
}