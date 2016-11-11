var Promise = require('bluebird');
var sequelize = require('./sequelize');
var Download = require('./download');

var XH = require('./xh');
var xh = new XH();

var Video = sequelize.models.Video;


function fillNullBytes(){
	console.time('fillNullBytes')
	xh.findOne({
		where : {
			completed : false,
			aborted : false,
			bytes : null
		}
	}).catch(function(err){
		if (err.message === 'NO_NULL_VIDEO') { process.exit(0); }
		console.error(err);
	}).then(function(video){
		if (!video) { return null; }


		var dld = new Download();
		console.log('HEAD', video.url, video.file);
		return dld.url( video.file ).info().then(function(info){
			video.bytes = info['content-length'];

			console.log(video.url, (video.bytes/1000000).toFixed(2), 'MB');
			console.log('##########################################');
			console.log('##########################################');
			console.log('                                          ');
			return video.save();
		});

	}).catch(function(err){
		console.error('ERROR', err)
		throw err
	}).finally(function(){
		console.timeEnd('fillNullBytes')
		return new Promise(function(resolve, reject){
			console.time('wait')
			setTimeout(function(){
				resolve(fillNullBytes())
				console.timeEnd('wait')
			}, 1000)
		})
	});
}
fillNullBytes();
