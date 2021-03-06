'use strict';

var debug = (function (debug) {
	var d = debug('scrapper')
	d.video = debug('scrapper:video')
	return d
})(require('debug'))

var XH = require('./xh');
var xh = new XH();

var sequelize = require('./sequelize');
var Video = sequelize.models.Video;

//xh.scrap('/channels/new-female_choice-1.html').then(onScrap);
//xh.top('female_choice').then(onScrap);



function onScrap(links) {
	if (!links.map) { return null; }
	return Promise.all(linksToDBModels(links));
}
function linksToDBModels(links) {
	return links.map(function (link) {
		if (blacklisted(link)) {
			debug('BLACKLISTED %s', link)
			return null
		}
		return Video.create({
			url: link
		}).then(function (instance) {
			debug.video('Created', instance.url);
			return instance;
		}).catch(function (err, arg2) {
			if (err.name == 'SequelizeUniqueConstraintError') {
				return Video.findOne({
					where: { url: link }
				});
			}
		});
	});
}

function blacklisted(str) {
	var arr = ['bondage', 'desi', 'dildo', 'dirty hobby', 'granny', 'lesbian']
	var found = arr.filter(w => {
		var ws = w.split(' ')
		var found = ws.filter(w => {
			return -1 !== str.indexOf(w)
		})
		return found.length == ws.length
	})
	return !!found.length
}

var urls = [
	{ url: '/rankings/weekly-top-videos.html', selector: 'top' },
	{ url: '/rankings/monthly-top-videos-1.html', selector: 'top' },
	{ url: '/rankings/alltime-top-videos-1.html', selector: 'top' },
	{ url: '/tags/big-cock' },
	{ url: '/tags/cock-worship' },
	{ url: '/tags/monster-cock' },
	{ url: '/tags/female-pov' },
	/*{ url: '/channels/new-argentinian-1.html' },
	{ url: '/channels/top-weekly-big_cocks-1.html', selector: 'top' },
	{ url: '/channels/top-weekly-big_cocks_shemales-1.html', selector: 'top' },
	//{ url : '/channels/top-weekly-brazilian-1.html', selector : 'top' },
	//{ url : '/channels/top-weekly-cuckold-1.html', selector : 'top' },
	{ url: '/channels/top-weekly-female_choice-1.html', selector: 'top' },
	{ url: '/channels/top-weekly-female_choice-2.html', selector: 'top' },
	//{ url : '/channels/top-weekly-hentai-1.html', selector : 'top' },
	//{ url : '/channels/top-weekly-old_young-1.html', selector : 'top' },
	{ url: '/channels/top-weekly-party-1.html', selector: 'top' },
	//{ url : '/channels/top-weekly-public-1.html', selector : 'top' },
	{ url: '/channels/top-monthly-argentinian-1.html', selector: 'top' },
	{ url: '/channels/top-monthly-big_cocks-1.html', selector: 'top' },
	{ url: '/channels/top-monthly-big_cocks-2.html', selector: 'top' },
	{ url: '/channels/top-monthly-big_cocks_shemales-1.html', selector: 'top' },
	{ url: '/channels/top-monthly-big_cocks_shemales-2.html', selector: 'top' },
	{ url: '/channels/top-monthly-bisexuals-1.html', selector: 'top' },*/
	//{ url : '/channels/top-monthly-brazilian-1.html', selector : 'top' }
]
	.concat(genPages({ url: '/channels/top-alltime-big_cocks-:pageNumber.html', selector: 'top' }, 10))
	.concat(genPages({ url: '/channels/top-alltime-bisexuals-:pageNumber.html', selector: 'top' }, 10))
	.concat(genPages({ url: '/channels/top-alltime-cfnm-:pageNumber.html', selector: 'top' }, 3))
	.concat(genPages({ url: '/channels/top-alltime-cuckold-:pageNumber.html', selector: 'top' }, 10))
	.concat(genPages({ url: '/channels/top-alltime-hentai-:pageNumber.html', selector: 'top' }, 10))
	.concat(genPages({ url: '/channels/top-alltime-vintage-:pageNumber.html', selector: 'top' }, 3))

function genPages(data, q) {
	var arr = []
	for (var i = 0; i < q; i++) {
		var url = data.url.replace(':pageNumber', i + 1)
		var new_data = Object.assign({}, data, {
			url
		})
		arr.push(new_data)
	}
	return arr
}

function scrapNumber(index) {
	if (index === undefined) { index = 0; }

	if (!(index < urls.length)) { return Promise.resolve('Ended at ' + index); }

	var url = urls[index].url;
	var selector = urls[index].selector;

	debug('scrapping #%d %s', index, urls[index].url)
	return xh.scrap(url, selector).then(onScrap).finally(function () {
		var next = index + 1;
		debug('scrapped %s', url)
		return scrapNumber(next);
	});
}
scrapNumber();
