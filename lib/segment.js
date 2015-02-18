var debug = require('debug')('segment');

/**
 * Represents a time slice of request data from the logs
 * 
 * @param {object} key
 */
var Segment = function (key, options) {
	options = options || {};
	this.key = key;
	this.log = [];
	this.counts = {};
	this.time = Date.now();
	this.minimumCount = parseInt(options.minimumCount, 10) || 0;
	debug('created - ' + key);
};

/**
 * Adds a request to the Segment. The request object will
 * be saved without duplication. Do not mutate the object later.
 *
 * @param {object} item - object to add, must contain 'key'
 */
Segment.prototype.add = function (item) {
	var key = item[this.key];
	debug('added item: ' + JSON.stringify(item));

	if(this.counts[key]) {
		this.counts[key]++;
	}
	else {
		this.counts[key] = 1;
	}

	this.log.push({time: this.time, data: item});
};

/**
 * @return {string}
 */
Segment.prototype.toString = function () {
	if(this.minimumCount <= 0) {
		return JSON.stringify({
			time: this.time,
			data: this.log
		});	
	}
	else {
		var filtered = this.log.filter(function (entry) {
			var url = entry.data.url;
			return this.counts[url] >= this.minimumCount;
		});
		return JSON.stringify({
			time: this.time,
			data: filtered
		});	
	}
};

module.exports = Segment;