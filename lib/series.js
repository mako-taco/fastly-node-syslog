var fs = require('fs'),
	path = require('path'),
	Segment = require('./segment'),
	debug = require('debug')('series');

/**
 * @param {object} data
 * @param {string} data.folder - stores segments to disk here
 * @param {number} data.interval - segment length, in ms
 * @param {number} [data.maxSegments=3000] - how many segments to keep on disk
 * @param {number} [data.minimumCount=3000] - dont write entries with less than
 *	this many counts to disk
 */
var Series = function (data) {
	data = data || {};
	this.folder = path.resolve(data.folder);
	this.segment = null;
	this.key = data.key;
	this.interval = data.interval;
	this.nodeInterval = null;
	this.maxSegments = (data.maxSegments === undefined)
		? 3000 
		: data.maxSegments;
	this.minimumCount = (data.minimumCount === undefined)
		? 0
		: data.minimumCount;

	//argument validation
	if(isNaN(parseInt(data.interval, 10))) {
		throw new Error('Could not parse interval: `' + data.interval + '`');
	}

	if(isNaN(parseInt(this.maxSegments, 10))) {
		throw new Error('Could not parse maxSegments: `' + data.maxSegments + '`');
	}

	if(isNaN(parseInt(this.minimumCount, 10))) {
		throw new Error('Could not parse minimumCount: `' + data.minimumCount + '`');
	}

	if(data.key === undefined) {
		throw new Error('Mising `key`, string required');
	}

	try {
		var stat = fs.statSync(this.folder);
		if(!stat.isDirectory()) {
			var err = new Error();
			err.code = 'NOT_A_DIRECTORY';
			throw err;
		}
	}
	catch(err) {
		if(err.code === 'ENOENT') {
			throw new Error('Folder does not exist: `' + this.folder + '`');
		}
		else if(err.code === 'NOT_A_DIRECTORY') {
			throw new Error('Not a directory: `' + this.folder + '`');
		}
		else {
			throw err;
		}
	}

	this.start();
};

Series.prototype.add = function (data) {
	if(!data.hasOwnProperty(this.key)) {
		debug('Item added to series missing key prop `' + this.key + '`');
	}
	this.segment.add(data);
};

Series.prototype.stop = function () {
	debug('series stopped ' + this.folder);
	clearInterval(this.nodeInterval);
};

Series.prototype.start = function () {
	debug('series started ' + this.folder);
	this.segment = this.makeNewSegment();

	if(this.nodeInterval === null) {
		this.nodeInterval = setInterval(function () {
			var filePath = path.resolve(this.folder, this.segment.time + '.sgm');
			
			debug('writing series to ' + filePath);
			fs.writeFile(filePath, this.segment.toString(), function (err) {
				if(err) {
					console.error('Could not write to `' + filePath + '`');
					console.error(err.stack);
				}
			});

			this.segment = this.makeNewSegment();
			this.deleteExtraRecords();
		}.bind(this), this.interval);
	}
	else {
		console.warn('Cannot start a series before stopping it');
	}
};

Series.prototype.makeNewSegment = function () {
	return new Segment(this.key, {
		minimumCount: this.minimumCount
	});
};

/**
 * Deletes the oldest files in a series folder until we have no more
 * than `maxSegments` remaining.
 */
Series.prototype.deleteExtraRecords = function () {
	fs.readdir(this.folder, function (err, files) {
		if(err) {
			throw err;
		}

		files = files.filter(function (file) {
			return file.indexOf('.sgm') > 0;
		});

		if(files.length > this.maxSegments) {
			files.sort()
				.slice(0, (files.length - this.maxSegments))
				.forEach(function (file) {
				debug('deleting ' + file);
				fs.unlink(path.join(this.folder, file), function (err) {
					if(err) {
						throw err;
					}
				});
			}.bind(this));
		}
	}.bind(this));
};

module.exports = Series;