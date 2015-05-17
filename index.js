var http = require('http');

var myexpress = function() {
	var app = function(req, res) {
		var next = function (err) {
			var m;
			if(err) {
				m = app.stack.shift();
				//如果是App embedding as middleware
				if(m != undefined && m.hasOwnProperty('use')) {
					m = m.stack.shift();
					//寻找subApp中的第一个error handler
					while(m != undefined && m.length != 4) {
						m = m.shift();
					}
					if(m != undefined) {
						m(err, req, res, next);
					}
					m = app.stack.shift();
				}
				while(m != undefined && m.length != 4) {
					m = app.stack.shift();
				}
				if(m == undefined) {
					res.statusCode=500;
					return err;
				}
				 try{
				 	m(err, req, res, next);
				 } catch(ex) {
				 	next(ex);
				 }
			} else {
				m = app.stack.shift();
				//如果是App embedding as middleware
				if(m != undefined && m.hasOwnProperty('use')) {
					m = m.stack.shift();
					//寻找subApp中的第一个非error handler
					while(m != undefined && m.length == 4) {
						m = m.shift();
					}
					if(m != undefined) {
						m(req, res, next);
					}
					m = app.stack.shift();
				}
				while(m != undefined && m.length == 4) {
					m = app.stack.shift();
				}
				if(m == undefined) {
					res.statusCode = 404;
					return;
				}
				try{
					m(req, res, next);
				} catch(e) {
					next(e);
				}
			}
		}
		next();
		res.end();
	};
	app.listen = function(port, done) {
		var server = http.createServer(app);
		server.listen(port, done);
		return server;
	}
	app.stack = [];
	app.use = function(m) {
		app.stack.push(m);
	};
	return app;
}

module.exports = myexpress;
