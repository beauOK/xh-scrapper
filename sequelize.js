
var Sequelize = require('sequelize');

var sequelize = new Sequelize('webscrapper_01', 'root', 'dugtgz', {
	//host: 'localhost',
	dialect: 'sqlite',
	storage: 'db.sqlite',
	//logging: null
});

var sync_options = {
	//force : true
}

var Video = sequelize.define('Video', {
	url: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	bytes: {
		type: Sequelize.BIGINT
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
	aborted: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
}, {
	scopes: {
		recent: function () {
			return {
				where: { createdAt: { $gt: new Date() - (1000 * 60 * 60 * 24 * 7) } }
			}
		}
	}
})

//Video.sync(sync_options)

module.exports = sequelize;
