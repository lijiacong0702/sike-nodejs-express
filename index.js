var http = require('http');
var Layer = require('./lib/layer');

var myexpress = function() {
	var app = function(req, res, next2, err2) {
		function trim(path) {
			var result;
			result = path.replace(/\/[^\/]*\/?/, "/");
			return result;
		};
		var i=-1;
		var m, matchResult;
		var next = function(err) {
			i++;
			m = app.stack[i];
			matchResult = m ? m.match(req.url) : undefined;
			if(err) {
				//如果是App embedding as middleware
				if(m && matchResult && typeof m.handle.handle === "function") {
					// Prefix path trimming for embedded app
					var oriUrl = req.url;
					req.url = trim(req.url);
					m.handle(req, res, next, err);
					req.url = oriUrl;
					next();
				} else {
					while(m && (! matchResult|| m.handle.length != 4) ){
						next(err);
					}
					if(m == undefined) {
						res.statusCode=500;
						return;
					}
					try{
						req.params = matchResult.params;
						m.handle(err, req, res, next);
					} catch(e) {
						next(e);
					}
				}
			} else {
				//如果是App embedding as middleware
				if(m && matchResult && typeof m.handle.handle === "function") {
					// Prefix path trimming for embedded app
					var oriUrl = req.url;
					req.url = trim(req.url);
					m.handle(req, res, next);
					req.url = oriUrl;
					next();
				} else {
					while(m && (!matchResult || m.handle.length == 4) ){
						next();
					}
					if(m == undefined) {
						res.statusCode=404;
						return;
					}
					try {
						req.params = matchResult.params;
						m.handle(req, res, next);
					} catch(e) {
						next(e);
					}
				}
			}
		};
		next(err2);
		if(next2) {
			return;
		} else {
			res.end();
		}
	};
	app.listen = function(port, done) {
		var server = http.createServer(app);
		server.listen(port, done);
		return server;
	}
	app.stack = [];
	app.use = function() {
		var layer;
		if(arguments.length == 1) {
			layer = new Layer('/', arguments[0]);
		} else {
			layer = new Layer(arguments[0], arguments[1]);
		}
		app.stack.push(layer);
	};
	app.handle = app;
	return app;
}

module.exports = myexpress;
