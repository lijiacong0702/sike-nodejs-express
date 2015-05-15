var http = require('http');

var myexpress = function() {
	return http.createServer(function(req, res) {
		res.statusCode = 404;
		res.end();
	});
}

module.exports = myexpress;