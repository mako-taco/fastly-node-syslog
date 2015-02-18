var net = require('net'),
	EventEmitter = require('./event-emitter'),
	debug = require('debug')('syslog');

/**
 * @param {function} parser - passed single log lines to parse
 */
var SyslogServer = function (parser) {
	this.parser = parser || function(){};
	this.buffered = '';
	this.tcpServer = net.createServer(function (cn) {
		debug('Connected.');
		
		cn.on('end', function () {
			debug('Disconnected.');
		});

		cn.on('data', function (data) {
			this.buffer(data);
		}.bind(this));

		cn.on('error', function (err) {
			this.emit('error');
		}.bind(this));
	}.bind(this));
};

SyslogServer.prototype = new EventEmitter();

SyslogServer.prototype.listen = function () {
	return this.tcpServer.listen.apply(this.tcpServer, arguments);
};

SyslogServer.prototype.buffer = function (data) {
	this.buffered += data.toString();
	
	var lines = this.buffered.split(/\r\n|\r|\n/g);

	for (var i=0; i<lines.length-1; i++) {
		if(lines[i].length === 0) continue;
		this.parse(lines[i]);
	}

	this.buffered = lines[lines.length-1];
};

SyslogServer.prototype.parse = function (line) {
	debug('raw: ' + line);
	var parsed = this.parser(line);

	debug('parsed: ', parsed);
	
	this.emit('data', parsed)
};

module.exports = SyslogServer;
