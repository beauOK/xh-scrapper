var axios = require('axios')
var cheerio = require('cheerio')

async function scrapVideoList(source) {
    var html = await axios.get(source).then(res => res.data)
    var $ = cheerio.load(html)
    var links = $('.thumb-list .thumb-list__item > a').get()
    return links.map(link => {
        return link.attribs.href
    })
}

async function scrapVideoUrl(source) {
    var html = await axios.get(source).then(res => res.data)
    var $ = cheerio.load(html)
    var video = $('a.xplayer').attr('href')
    return video
}

function generateNameFromURL(url) {
    var parts = url.split('/')
    var name = parts[parts.length - 1]
    var numbers = name.split('').filter(char => !isNaN(char)).join('')
    return numbers + '.' + name
}

function cleanURL(str) {
    var url = require('url')
    var new_url = url.parse(str)
    return url.resolve('http://xhamster.com/', new_url.pathname)
}

Object.assign(module.exports, {
    scrapVideoList,
    scrapVideoUrl,
    generateNameFromURL
})