if (process.argv.length !== 5) { throw new Error('Wrong number of arguments.'); }


var sequelize = require('./sequelize');


var id = process.argv[2];
var aborted = JSON.parse( process.argv[3] );
var completed = JSON.parse( process.argv[4] );


var Video = sequelize.model('Video');


Video.findById(id).then(function(video){
	
	video.aborted = aborted;
	video.completed = completed;
	return video.save();

});
