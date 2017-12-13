var debug = (function (debug) {
	var d = debug('filler')
	d.video = debug('filler:video')
	return d
})(require('debug'))


var axios = require('axios')
var Promise = require('bluebird');
var fetch = require('node-fetch')
var sequelize = require('./sequelize');
var Download = require('./download');
var { scrapVideoUrl } = require('./lib/index')

var XH = require('./xh');
var xh = new XH();

sequelize.options.logging = null
var Video = sequelize.model('Video');

function getAVideo() {
	return xh.findOne({
		where: {
			completed: false,
			aborted: false,
			bytes: null
		}
	})
}

async function main() {
	var total = await Video.all({
		where: {
			completed: false,
			aborted: false,
			bytes: null
		}
	}).then(videos => videos.length)

	var run = true
	while (run) {
		var video = await Video.findOne({
			where: {
				completed: false,
				aborted: false,
				bytes: null
			}
		})
		if (!video) return
		debug('video found', video.id)

		var videoSource = await scrapVideoUrl(video.url)
		if (!videoSource) {
			video.aborted = true
		} else {
			debug('video url', videoSource)
			try {
				var bytes = await getContentLength(videoSource)
				debug('video size', bytes)
				video.bytes = bytes
			} catch (err) {
				video.aborted = true
			}
		}
		await video.save()
		
		total--
		console.log('videos left', total)
	}
}

async function getContentLength(url) {
	var response = await fetch(url, { method: 'HEAD' })
	return +response.headers.get('content-length')
}

main().catch(err => {
	console.log(err)
})
