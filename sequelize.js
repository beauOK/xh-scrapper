(function(){
	
	var Sequelize = require('sequelize');

	var sequelize = new Sequelize('webscrapper_01', 'root', 'dugtgz', {
		host : 'localhost',
		dialect : 'mysql',
		logging : null
	});



	var sync_options = {
		//force : true
	}



	sequelize.define('Video', {
		url : {
			type : Sequelize.STRING,
			allowNull : false,
			unique : true
		},
		bytes : {
			type : Sequelize.BIGINT
		},
		completed : {
			type : Sequelize.BOOLEAN,
			allowNull : false,
			defaultValue : false
		},
		aborted : {
			type : Sequelize.BOOLEAN,
			allowNull : false,
			defaultValue : false
		}
	}).sync(sync_options);

	sequelize.models.Video.myUpsert = function (obj) {
		return new Promise(function cb(resolve, reject){

			sequelize.models.Video.upsert(obj).then(function (created) {
				
				sequelize.models.Video.find({
					where : obj
				}).then(function (video, created) {
					resolve( video );
				});
				
			});

		});
	}


	module.exports = sequelize;

})();