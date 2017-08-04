var path = require('path');
var util = require('util');
var fs = require('fs');






var Download = require('./download');
var sequelize = require('./sequelize');



var Video = sequelize.model('Video');

var XH = require('./xh.js');
var xh = new XH();

setTimeout(function(){
	process.exit(0);
}, 1000 * 60 * 60 * 2);


var current_video = null;

(function VantageConfig(){
	
	var vantage = require('vantage')();
	vantage.command('skip').description('Aborts current download.').action(function(args, callback){
		current_video.aborted = true;
		current_video.save().then(function(){
			callback();
			process.exit(0);
		});
	});
	vantage.command('current').description('Shows current download.').action(function(args, callback){
		this.log(current_video.url);
		callback();
	});
	vantage.command('abort <query>').description('Abort like.').action(function(args, callback){
		var self = this;
		var options = {
			where : {
				url : { $like : '%'+args.query+'%' },
				completed : false,
				aborted : false
			}
		}
		Video.update({
			aborted : true
		}, options).then(function(rs){
			self.log(rs);
			callback();
		});
	});
	vantage.command('count <query>').description('Count like.').action(function(args, callback){
		var self = this;
		var options = {
			where : {
				url : { $like : '%'+args.query+'%' },
				completed : false,
				aborted : false
			}
		}
		Video.findAll(options).then(function(videos){
			self.log(videos.length);
			callback();
		});
	});
	vantage.delimiter('downloader~$').listen(4001);

})();

(function main(){

	Video.findOne({
		where : {
			id : {
				$ne : 20683
			},
			completed : false,
			aborted : false,
			bytes : {
				$lt : 1000000 * 400
			}
		},
		order : ['bytes']
	}).then(function(video){

		if (!video) { util.log('No video to download.'); return Promise.reject('no video'); }
		
		util.log( video.url );

		current_video = video;

		var p = Promise.all([
			Promise.resolve(video),
			xh.video( video.url ).catch(function(err){
				if (err.message === 'URL_NO_VIDEO') {
					video.aborted = true;
					return video.save().then(function(){
						return Promise.reject('URL_NO_VIDEO');
					});
				}
				util.log('ERROR', err);
			}),
			Promise.resolve( xh.suggestedName(video.url) ),
		]);
		return p;
	}).spread(function(video, mp4, title){
		util.log({
			id : video.id,
			mp4 : mp4,
			title : title
		})

		if (!mp4) { return; }

		var bytes_to_download = video.bytes;

		var dld = new Download();
		dld.url( mp4 ).output( path.join('downloading', title) );
		
		var show_progress = true;
		dld.on('data', function(data){
			bytes_to_download = bytes_to_download - data.length;

			if (show_progress) {
				var progress = (100-((bytes_to_download * 100)/video.bytes));
				console.log( progressBar((100-progress)/100) );
				var mb_left = (bytes_to_download/1000000).toFixed(2)
				util.log(mb_left+'/'+(video.bytes/1000000).toFixed(2)+'MB', '('+video.id+')', title, '<<', progress.toFixed(2)+'%');
				show_progress = false;
				setTimeout(function(){ show_progress = true; }, 1000 * 2);
			}
		});

		return dld.start().then(function(){
			video.completed = true;
			return video.save();
		}).then(function(){
			var old_name = path.join('./downloading', title);
			var new_name = path.join('/mnt/sda1/home/public/asd/node', title);
			return rename(old_name, new_name);
		});
	}).catch(function(err){
		return new Promise(function(resolve, reject){
			setTimeout(resolve, 1000 * 10);
		});
	}).finally(main);

})()

function rename(old_name, new_name){
	
	console.log('moving', old_name, 'to', new_name);

	return new Promise(function(resolve, reject){

		var mtime = fs.statSync(old_name).mtime;
		var old_file = fs.createReadStream( old_name );
		var new_file = fs.createWriteStream( new_name );
		old_file.pipe(new_file);
		old_file.on('end', function(){
			fs.utimesSync( new_name, Date.now(), mtime );
			fs.unlink(old_name);
			resolve(new_name);
		});

	}).catch(function(err){
		console.error(err)
	});
}

function progressBar(percent){
	var max = process.stdout.columns || 100;
	var str = '';
	for (var i = 0; i < (max*percent); i++){
		str += '.';
	}
	return str;
}
