var debug = require('debug')('XHamster')

var fs = require('fs');
var validator = require('validator');
var request = require('request');
var cheerio = require('cheerio');
var sequelize = require('./sequelize');
var Promise = require('bluebird');

/**
* @class XHamster
*/
function XHamster(){
	
	/**
	* @param {string} url URL to scrap.
	* @fires XHamster#info
	* @memberof XHamster#
	*/
	function scrap(path, _selector){
		var _url = 'http://www.xhamster.com' + path;

		var selector = (function selector(_selector){
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


		return new Promise(function(resolve, reject){
			return request(_url, function(err, response, html){
				if (err) { return reject(new Error(err)); }

				var $;
				try { $ = cheerio.load(html); }
				catch (e) { return reject(new Error(e.message)); }

				var links = $(selector).find('a');
				var videos = [];
				links.map(function(i){
					var link = links[i];
					if (link.attribs && link.attribs.href) {
						if (validator.isURL(link.attribs.href)) {
							var clean_url = cleanURL( link.attribs.href );
							videos.push( clean_url );
						}
					}
				});
				return resolve(videos);
			});
		});
	}

	function cleanURL(str){
		var url = require('url');
		var new_url = url.parse(str);
		return url.resolve( 'http://xhamster.com/', new_url.pathname )
	}

	function top (channel, interval) {
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

	function video (_url) {
		var p = new Promise(function(resolve, reject){

			var r = request(_url, {
				timeout : 1000 * 2
			}, function cb(err, response, html){

				if (err) { return reject(new Error('REQUEST_ERROR')); }



				var $;
				try { $ = cheerio.load(html); }
				catch (e) { return reject(new Error('CHEERIO_ERROR')); }

				//fs.writeFileSync('download.html', html);
				
				var href = $('div#player .noFlash a').attr('href');
				
				if ( !href ) {
					return reject(new Error('URL_NO_VIDEO'));
				}


				return resolve( href );
			});
		});
		return p;
	}

	function findOne(options){
		return sequelize.models.Video.findOne(options).then(function(instance){

			if (!instance) { return Promise.reject(new Error('NO_NULL_VIDEO')); }

			debug(instance.url);
			return video( instance.url ).catch(function(err){
				if (err.message === 'URL_NO_VIDEO') {
					instance.aborted = true;
					return instance.save().then(function(){
						return Promise.reject(err);
					});
				}
				return null;
			}).then(function(url){
				if (!url) { return null; }
				instance.file = url;
				return instance;
			});
		});
	}

	function suggestedName ( _html ) {

		var name = /(\d+\/\w+)/.exec(_html);
		if ( name && name[0] ) {
			name = name[0];
		} else {
			return null;
		}

		return name.replace('/', '.') + '.mp4';
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