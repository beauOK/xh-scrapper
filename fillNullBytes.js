var debug = (function(debug){
	var d = debug('filler')
	d.video = debug('filler:video')
	return d
})(require('debug'))


var Promise = require('bluebird');
var sequelize = require('./sequelize');
var Download = require('./download');

var XH = require('./xh');
var xh = new XH();

var Video = sequelize.model('Video');


function fillNullBytes(){
	xh.findOne({
		where : {
			completed : false,
			aborted : false,
			bytes : null
		}
	}).catch(function(err){
		if (err.message === 'NO_NULL_VIDEO') { process.exit(0); }
		console.log(err)
		throw err
	}).then(function(video){

		if (!video) { return null; }

		var dld = new Download();
		debug.video('URL %s', video.url)
		return dld.url( video.file ).info().then(function(info){
			video.bytes = info['content-length'];

			debug.video('%s MB', (video.bytes/1000000).toFixed(2))
			console.log()
			return video.save();
		}).catch(function(err){
			console.error('ERROR', 'dld.url', err)
			throw err
		});

	}).catch(function(err){
		console.error('ERROR', err)
		throw err
	}).finally(function(){
		return new Promise(function(resolve, reject){
			setTimeout(function(){
				resolve(fillNullBytes())
			}, 1000)
		})
	});
}
fillNullBytes();
