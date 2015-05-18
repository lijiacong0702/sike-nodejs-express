var http = require('http');
var Layer = require('./lib/layer');

var myexpress = function() {
	var app = function(req, res) {
		// var next = function (err) {
		// 	var m;
		// 	if(err) {
		// 		m = app.stack.shift();
		// 		//如果是App embedding as middleware
		// 		if(m != undefined && m.hasOwnProperty('use')) {
		// 			m = m.stack.shift();
		// 			//寻找subApp中的第一个error handler
		// 			while(m != undefined && m.length != 4) {
		// 				m = m.shift();
		// 			}
		// 			if(m != undefined) {
		// 				m(err, req, res, next);
		// 			}
		// 			m = app.stack.shift();
		// 		}
		// 		while(m != undefined && m.length != 4) {
		// 			m = app.stack.shift();
		// 		}
		// 		if(m == undefined) {
		// 			res.statusCode=500;
		// 			return err;
		// 		}
		// 		 try{
		// 		 	m(err, req, res, next);
		// 		 } catch(ex) {
		// 		 	next(ex);
		// 		 }
		// 	} else {
		// 		m = app.stack.shift();
		// 		//如果是App embedding as middleware
		// 		if(m != undefined && m.hasOwnProperty('use')) {
		// 			m = m.stack.shift();
		// 			//寻找subApp中的第一个非error handler
		// 			while(m != undefined && m.length == 4) {
		// 				m = m.shift();
		// 			}
		// 			if(m != undefined) {
		// 				m(req, res, next);
		// 			}
		// 			m = app.stack.shift();
		// 		}
		// 		while(m != undefined && m.length == 4) {
		// 			m = app.stack.shift();
		// 		}
		// 		if(m == undefined) {
		// 			res.statusCode = 404;
		// 			return;
		// 		}
		// 		try{
		// 			m(req, res, next);
		// 		} catch(e) {
		// 			next(e);
		// 		}
		// 	}
		// }
		var next = function(err) {
			var m;
			var i=0;
			if(err) {
				m = app.stack[i];
				while(m && (!m.match(req.url) || m.handle.length != 4) ){
					i++;
					m = app.stack[i];
				}
				if(m == undefined) {
					res.statusCode=500;
					return;
				}
				try{
					m.handle(err, req, res, next);
				} catch(e) {
					next(e);
				}
			} else {
				m = app.stack[i];
				while(m && (!m.match(req.url) || m.handle.length == 4) ){
					i++;
					m = app.stack[i];
				}
				if(m == undefined) {
					res.statusCode=404;
					return;
				}
				try{
					m.handle(req, res, next);
				} catch(e) {
					next(e);
				}
			}
		};
		next();
		res.end();
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
	return app;
}

module.exports = myexpress;
