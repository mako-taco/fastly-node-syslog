var SyslogServer = require('./lib/syslog-server'),
	Series = require('./lib/series'),
	express = require('express'),
	path = require('path'),
	fs = require('graceful-fs');

var byHour = new Series({
	folder: 'logs/hour',
	interval: 1000*60*60,
	maxSegments: 3000,
	key: 'url'
});

var byMinute = new Series({
	folder: 'logs/minute',
	interval: 1000*60,
	maxSegments: 3000,
	key: 'url'
});

var bySecond = new Series({
	folder: 'logs/second',
	interval: 1000,
	maxSegments: 1000,
	key: 'url'
});

var segments = [bySecond, byMinute, byHour];

var syslog = new SyslogServer(function (line) {
	var parts = line.split(' ');

	return {
		method: parts[parts.length - 4],
		url: parts[parts.length - 3],
		status: parts[parts.length - 2],
		size: parts[parts.length - 1]
	};
});

syslog.on('data', function (data) {
	for(var i=0; i<segments.length; i++) {
		segments[i].add(data);
	}
});

syslog.on('error', function (err) {
	console.error('Syslog error:', err.stack);
});

syslog.listen(8888);

var app = express();

/**
 * Chart page (html)
 */
app.get('/', function (req, res, next) {
	fs.readFile('./public/index.html', function (err, data) {
		if(err) {
			next(err);
		}
		else {
			res.writeHead(200, {
				'Content-Type': 'text/html',
				'Content-Length': data.length
			});
			res.end(data);
		}
	});
});

/**
 * Data endpoint (json)
 * This will always give you back some JSON, but it might look a little
 * different every now and then due to fs errors.
 * 
 *		{
 * 			content: [
 *				{
 *					time: 12345789,
 *					data: [
 *						{url: '/', method: 'GET', status: 200, size: 1298},
 *						{url: '/hi', method: 'GET', status: 200, size: 298},
 *						{url: '/bye', method: 'GET', status: 404, size: 377},
 *						{error: 'This will exist if there was an error w/ a specific file'}
 *					]
 *				},
 *				{
 *					time: 12346790,
 *					data: [
 *						{url: '/', method: 'GET', status: 200, size: 1298},
 *						{url: '/hi', method: 'GET', status: 200, size: 298},
 *						{url: '/bye', method: 'GET', status: 404, size: 377}
 *					]
 *				}
 *			],
 *			error: "This will only exist if there was a major problem"
 * 		}
 *
 * Query params: 
 *	start - ms to start getting samples from
 *	end - ms to stop getting samples from
 *	max - max samples to return
 */
app.get('/logs/:sample.json', function (req, res) {
	var folder;
	if(req.params.sample === 'seconds') {
		folder = path.join('logs','second');
	}
	else if(req.params.sample === 'minutes') {
		folder = path.join('logs','minute');
	}
	else if(req.params.sample === 'hours') {
		folder = path.join('logs','hour');
	}
	else {
		return res.send(404, 'available logs: seconds/minutes/hours');
	}

	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Transfer-Encoding': 'chunked'
	});

	res.write('{"content":[');

	fs.readdir(folder, function (err, files) {
		if(err) {
			res.end('],"error":"' + err.stack + '"}');
		}
		else {
			var count = 0;
			var filteredFileCount = 0; //number of files that passed the filter

			files = files.filter(function (file) {
				if(req.query) {
					var timestamp = parseInt(file, 10);
					var start = parseInt(req.query.start);
					var end = parseInt(req.query.end);
					var max = parseInt(req.query.max);
					if(start && start > timestamp) {
						return false;
					}
					if(end && end < timestamp) {
						return false;
					}
					if(max && max < filteredFileCount) {
						return false;
					}
				}

				if(file.indexOf('.sgm') === -1) {
					return false;
				}

				filteredFileCount++;
				return true;
			});

			files.forEach(function (file) {
				fs.readFile(path.join(folder,file), function (err, data) {
					count++;

					if(err) {
						res.write('{"error":"' + err.stack + '"}');
					}
					else {
						res.write(data);
					}

					
					if(count !== files.length) {
						res.write(',')
					}
					else {
						res.end(']}');
					}
				});
			});
		}
	});
});

app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname + '/build/public'));

app.listen(8889);
