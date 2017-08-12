var axios = require('axios')
var cheerio = require('cheerio')

var scrapVideoUrl = exports.scrapVideoUrl = function scrapVideoUrl(source) {
    var onHTML = axios.get(source).then(res => res.data)
    var on$ = onHTML.then(html => cheerio.load(html))
    return on$.then($ => {
        
        var video = $('div#player .noFlash a').attr('href')
        return video

    })
}
