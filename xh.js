var debug = require('debug')('XHamster')

var Queue = require('promise-queue')
var Promise = require('bluebird')
var cheerio = require('cheerio')
var fs = require('fs')
var path = require('path')
var request = require('request')
var sequelize = require('./sequelize')
var uuid = require('uuid')
var validator = require('validator')

/**
* @class XHamster
*/
function XHamster() {

	var scrapQueue = new Queue(2, Infinity)
	/**
	* @param {string} url URL to scrap.
	* @fires XHamster#info
	* @memberof XHamster#
	*/
	function scrap(path, _selector) {
		var _url = 'http://www.xhamster.com' + path;

		var selector = (function selector(_selector) {
			if (!_selector) { return 'div.videoList > div.video'; }

			switch (_selector) {

				case 1:
					return 'div.videoList div.video';

				case 'top':
					return 'div.videoList div.video';

				case 'user':
					return 'div.video';

				default:
					return 'div.videoList > div.video';
			}

		})(_selector);

		selector = '.thumb-list .thumb-list__item > a'

		return new Promise(function (resolve, reject) {
			return request(_url, function (err, response, html) {
				if (err) { return reject(new Error(err)); }

				var $;
				try { $ = cheerio.load(html); }
				catch (e) { return reject(new Error(e.message)); }

				var links = $(selector);
				console.log(_url, 'links found', links.length)
				var videos = [];
				links.map(function (i) {
					var link = links[i];
					if (link.attribs && link.attribs.href) {
						if (validator.isURL(link.attribs.href)) {
							var clean_url = cleanURL(link.attribs.href);
							videos.push(clean_url);
						}
					}
				});
				return resolve(videos);
			});
		});
	}

	function cleanURL(str) {
		var url = require('url');
		var new_url = url.parse(str);
		return url.resolve('http://xhamster.com/', new_url.pathname)
	}

	function top(channel, interval) {
		var _url;

		if (!channel) {
			_url = '/rankings/:interval-top-videos-1.html';
		} else {
			_url = '/channels/top-:interval-:channel-1.html';
		}
		interval = interval || 'weekly';

		_url = _url.replace(':channel', channel).replace(':interval', interval);

		return scrap(_url, 'top');
	}

	function video(_url) {
		var { scrapVideoUrl } = require('./lib/index')
		return scrapVideoUrl(_url)
	}

	function findOne(options) {
		return sequelize.model('Video').findOne(options).then(function (instance) {

			if (!instance) {
				return Promise.reject(new Error('NO_NULL_VIDEO'));
			}

			debug(instance.url);
			return video(instance.url).catch(function (err) {
				console.log(err)
				if (err.message === 'URL_NO_VIDEO') {
					instance.aborted = true;
					return instance.save().then(function () {
						throw err
					});
				}
				return null;
			}).then(async function (url) {
				if (!url) {
					instance.aborted = true
					await instance.save()
					return null;
				}
				instance.file = url;
				return instance;
			});
		});
	}

	function suggestedName(_html) {
		var name = require('./lib').generateNameFromURL(_html)
		return name + '.mp4'
	}

	this.video = video;
	this.top = top;
	this.scrap = scrap;
	this.findOne = findOne;
	this.suggestedName = suggestedName;

	/**
	* Some info from xh.
	* @event XHamster#info
	*/
}

module.exports = XHamster;