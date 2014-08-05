const NODE_PORT = process.env.NODE_PORT || 8888;

var net = require('net');
var server = net.createServer(function(c) { //'connection' listener
  console.log('server connected');
  c.on('end', function() {
    console.log('server disconnected');
  });
  c.write('hello\r\n');
  c.on('data', function (data) {
  	console.log(data.toString());
  });
});

server.listen(NODE_PORT, function() { //'listening' listener
  console.log('server bound');
});