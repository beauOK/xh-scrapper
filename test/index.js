var { scrapVideoList, scrapVideoUrl, generateNameFromURL } = require('../lib')
var XH = require('../xh');
var validator = require('validator')

describe('lib', function () {

    this.timeout(1000 * 10)

    var url = 'https://xhamster.com/videos/twin-8093441'

    it('get mp4 url', async () => {
        var videoURL = await scrapVideoUrl(url)
        if (validator.isURL(videoURL)) return videoURL
        throw new Error('NotAURL')
    })

    it.only('get url links', async () => {
        await scrapVideoList('https://www.xhamster.com/rankings/weekly-top-videos.html')
        return
        var xh = new XH()
        var links = await xh.scrap('/rankings/weekly-top-videos.html')
        links.map(link => {
            if (validator.isURL(link)) return link
            throw new Error('NotAURL')
        })
    })

    it('gets a name', () => {
        var xh = new XH()
        var name = xh.suggestedName(url)
    })

})