var Promise = require('bluebird');
var EventEmitter = require('events');
var util = require('util');

var fs = require('fs');
var crypto = require('crypto');
var moment = require('moment');
var node_url = require('url');

var request = require('request');






/**
* Download class.
* @class Download
*/
function Download () {
	this.instanceOf = arguments.callee.name;

	var self = this;

	/**
	* requestjs instace. The actual worker.
	* @var {request} Download#_downloader
	*/
	this._downloader = null;
	/**
	* File stream. The download will be saved here.
	* @var {Stream} Download#_output_file_stream
	*/
	this._output_file_stream = null;
	this._attr = {}

	function set(key, value){
		self._attr[key] = value;
		return self;
	}
	function get(key){
		return self._attr[key];
	}


	/**
	* Gets or sets URL.
	* @param {string} value URL to download.
	* @returns {Download} self
	* @memberof Download#
	*/
	function url(value){
		if (value === undefined) {
			return get('url');
		} else {
			return set('url', value);
		}
	}

	/**
	* Gets or sets output file. Download will save to this file.
	* @param {string} filename Output file
	* @returns {Download} self
	* @memberof Download#
	*/
	function outputFile(value){
		if (value === undefined) {
			return get('output_file');
		} else {
			return set('output_file', value);
		}
	}

	/**
	* Gets headers from url.
	* @returns {Promise} Response headers
	* @fires Download#info
	* @memberof Download#
	*/
	function info(){
		return new Promise(function cb(resolve, reject){
			if ( !url() ) {
				return reject(new Error('URL_NOT_SET'));
			}
			var r = request.head(url(), function cb(err, response, body){
				
				if (err) {
					return reject(err);
				}

				//console.log((response.statusCode/100).toFixed(0))
				if ( (response.statusCode/100).toFixed(0) != 2 ) {
					return reject(new Error('URL_UNAVAILABLE'));
				}

				self.emit('info', response.headers);
				return resolve(response.headers);
			});

		});
	}

	/**
	* Starts download.
	* @memberof Download#
	* @returns {Download} self
	* @fires Download#data
	* @fires Download#end
	* @fires Download#error
	*/
	function start(){
		return new Promise(function(resolve, reject){
			if (!url()) {
				return reject(new Error('URL_NOT_SET'));
			}

			var output = fs.createWriteStream( outputFile() );
			
			self._downloader = request( url() );

			var mtime = null;
			self._downloader.on('response', function(response){
				mtime = new Date( response.headers['last-modified'] );
			});

			self._downloader.pipe( output );

			self._downloader.on('data', function(data){
				self.emit('data', data);
			})
			self._downloader.on('end', function(){
				if (mtime) { fs.utimesSync( outputFile(), Date.now(), mtime ); }
				return resolve(self._downloader);
			});
			self._downloader.on('error', function(err){
				return reject(new Error(err));
			});



			return self._downloader;
		});
	}



	this.url = url;
	
	this.outputFile = outputFile;
	this.output = outputFile;

	this.info = info;
	this.start = start;



	/**
	* Got response headers from url.
	* @event Download#info
	* @property {Object} headers - Response headers
	*/
	/**
	* Data arrived from server.
	* @event Download#data
	* @property {Buffer} data - Chunked data
	*/
	/**
	* Download ended.
	* @event Download#end
	*/
	EventEmitter.call(this);
}
util.inherits(Download, EventEmitter);



module.exports = Download;