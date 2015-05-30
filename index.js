var http = require('http');
var Layer = require('./lib/layer');
var makeRoute = require('./lib/route');
var crc32 = require('buffer-crc32');

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
				if(err.message === 'Not Acceptable') {
					return;
				}
				//如果是App embedding as middleware
				if(m && matchResult && typeof m.handle.handle === "function") {
					req.app = m.handler;
					// Prefix path trimming for embedded app
					var oriUrl = req.url;
					req.url = trim(req.url);
					m.handle(req, res, next, err);
					req.url = oriUrl;
					req.app = app;
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
					req.app = m.handler;
					// Prefix path trimming for embedded app
					var oriUrl = req.url;
					req.url = trim(req.url);
					m.handle(req, res, next);
					req.url = oriUrl;
					req.app = app;
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
						next();
					} catch(e) {
						next(e);
					}
				}
			}
		};

		//call monkey_patch before calling middlewares.
		app.monkey_patch(req, res, next2);
		req.res = res;
		res.req = req;
		req.app = app;
		
		res.redirect = function() {
			if(arguments.length == 1) {
				res.writeHead(302, {'Content-Length': 0,'Location' : arguments[0]});
			} else {
				res.writeHead(arguments[0], {'Content-Length': 0,'Location' : arguments[1]});
			}
			res.end();
		};

		var mime = require('mime');
		res.type = function(ext) {
			var mimeType = mime.lookup(ext);
			res.setHeader('Content-Type', mimeType);
		};

		res.default_type = function(ext) {
			var mimeType = mime.lookup(ext);
			var oriType = res.getHeader('content-type');
			if(!oriType) {
				res.setHeader('Content-Type', mimeType);
			}
		}

		var accepts = require('accepts');
		res.format = function(obj) {
			var accept = accepts(req);
			var key = accept.types(Object.keys(obj));
			if(key != '*/*') {
				res.type(key);
				obj[key]();
			} else {
				res.statusCode = 406;
				var err = new Error("Not Acceptable");
				throw err;
			}
		};

		res.send = function() {
			if(req.method === 'GET') {
				var oriEtag = res.getHeader('ETag');
				var reqEtag = req.headers['if-none-match'];
				if(oriEtag != undefined && reqEtag != undefined && reqEtag === oriEtag) {
					res.statusCode = 304;
					res.end();
				}
				var reqLastModified = req.headers['if-modified-since'];
				var resLastModified = res.getHeader('Last-Modified');
				if(reqLastModified != undefined && resLastModified != undefined && reqLastModified >= resLastModified) {
					res.statusCode = 304;
					res.end();
				}
				if(!oriEtag) {
					if(arguments.length === 1) {
						if(typeof arguments[0] === 'string') {
							if(arguments[0] !== "") {
								res.setHeader('ETag', '"'+crc32.unsigned(arguments[0])+'"');
							}
						}
					} else  if(arguments.length === 2){
						if(typeof arguments[1] === 'string') {
							if(arguments[1] !== "") {
								res.setHeader('ETag', '"'+crc32.unsigned(arguments[1])+'"');
							}
						}
					}
				}
			}

			if(arguments.length === 1) {
				if(typeof arguments[0] === 'number') {
					res.statusCode = arguments[0];
					res.end(http.STATUS_CODES[arguments[0]]);
				} else {
					var oriType = res.getHeader('content-type');
					if(!oriType) {
						if(arguments[0] instanceof Buffer) {
							res.setHeader('Content-Type', 'application/octet-stream');
							res.setHeader('Content-Length', arguments[0].length);
						} else if(typeof arguments[0] == 'string') {
							res.setHeader('Content-Type', 'text/html');
							res.setHeader('Content-Length', Buffer.byteLength(arguments[0]));
						} else {
							res.setHeader('Content-Type', 'application/json');
							res.setHeader('Content-Length', JSON.stringify(arguments[0]).length);
							res.statusCode=200;
							res.end(JSON.stringify(arguments[0]));
						}
					}
					res.statusCode=200;
					res.end(arguments[0]);
				}
			} else if(arguments.length === 2){
				var oriType = res.getHeader('content-type');
				if(!oriType) {
					if(arguments[1] instanceof Buffer) {
						res.setHeader('Content-Type', 'application/octet-stream');
						res.setHeader('Content-Length', arguments[1].length);
					} else if(typeof arguments[1] == 'string') {
						res.setHeader('Content-Type', 'text/html');
						res.setHeader('Content-Length', Buffer.byteLength(arguments[1]));
					} else {
							res.setHeader('Content-Type', 'application/json');
							res.setHeader('Content-Length', JSON.stringify(arguments[1]).length);
							res.statusCode=200;
							res.end(JSON.stringify(arguments[1]));
					}
				}
				res.statusCode=arguments[0];
				res.end(arguments[1]);
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
		var layer, options;
		if(arguments.length == 1) {
			options = arguments[1] ? arguments[1] : {};
			layer = new Layer('/', arguments[0], options);
		} else {
			options = arguments[2] ? arguments[2] : {};
			layer = new Layer(arguments[0], arguments[1], options);
		}
		app.stack.push(layer);
	};

	app.route = function(path) {
		var route = makeRoute();
		app.use(path, route);
		return route;
	};

	var methods = require('methods').concat("all");
	methods.forEach(function(method) {
		app[method] = function(path, handler) {
			app.route(path)[method](handler);
			return app;
		}
	});

	app._factories = {};
	app.factory = function(name, fn) {
		app._factories[name] = fn;
	};

	var injector = require('./lib/injector');
	app.inject = function(fn) {
		return injector(fn, app);
	}

	var request = require('./lib/request');
	var response = require('./lib/response');
	app.monkey_patch = function(req, res) {
		req.__proto__ = request(req);
		res.__proto__ = response(res);
	}

	app.handle = app;
	return app;
}

module.exports = myexpress;
