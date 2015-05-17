var request = require('supertest');
var expect = require('chai').expect;
var http = require('http');

var express = require('../');



describe('app', function() {
	describe('Implement Empty App', function() {
		var app = express();
		describe('as handler to http.createServer', function() {
			it('responds to /foo with 404', function(done) {
				var server = http.createServer(app);
				request(server).get('/foo').expect(404).end(done);
			});
		});
	});

	describe('#listen', function() {
		describe('Define the app.listen method', function() {
			var app = express();
			var server;
			before(function(done) {
				server = app.listen(4000, done);
			}) ;
			it('should return an http.Server', function() {
				expect(server).to.be.instanceof(http.Server);
			});
			it('responds to /foo with 404', function(done){
				request('http://localhost:4000').get('/foo').expect(404).end(done);
			});
		});
	});

	describe('.use', function() {
		describe('Implement app.use', function() {
			var app = express();
			var m1 = function() {};
			var m2 = function() {};
			app.use(m1);
			app.use(m2);
			it('should be able to add middlewares to stack', function() {
				expect(app.stack[0]).to.equal(m1);
				expect(app.stack[1]).to.equal(m2);
			});	
		});
	});

	describe('calling middleware stack', function() {
		var app;
		beforeEach(function() {
			app = new express();
		});

		it('Should be able to call a single middleware', function(done) {
			var m1 = function(req, res, next) {
				res.end('hello from m1');
			};
			app.use(m1);
			request(app).get('/').expect('hello from m1').end(done);
		});

		it('Should be able to call next to go to the next middleware', function(done) {
			var m1 = function(req, res, next) {
				next();
			};

			var m2 = function(req, res, next) {
				res.end('hello from m2');
			};

			app.use(m1);
			app.use(m2);
			request(app).get('/').expect('hello from m2').end(done);
		});

		it('Should 404 at the end of middleware chain', function(done) {
			var m1 = function(req, res, next) {
				next();
			};

			var m2 = function(req, res, next) {
				next();	
			};

			app.use(m1);
			app.use(m2);
			request(app).get('/').expect(404).end(done);			
		});

		it('Should 404 if no middleware is added', function(done) {
			app.stack = [];
			request(app).get('/').expect(404).end(done);
		});
	});

	describe('Error handle', function() {
		var app;
		beforeEach(function() {
			app = new express();
		});

		it('should return 500 for unhandled error', function(done) {
			var m1 = function(req, res, next) {
				next(new Error('boom!'));
			}
			app.use(m1);
			request(app).get('/').expect(500).end(done);
		});

		it('should return 500 for uncaught error', function(done) {
			var m1 = function(req, res, next) {
				throw new Error('boom!');
			};
			app.use(m1);
			request(app).get('/').expect(500).end(done);
		});		

		it('should skip error handlers when next is called without an error', function(done) {
			var m1 = function(req, res, next) {
				next();
			};

			var e1 = function(err, req, res, next) {

			};

			var m2 = function(req, res, next) {
				res.end('m2');
			};

			app.use(m1);
			app.use(e1);
			app.use(m2);
			request(app).get('/').expect('m2').end(done);
		});

		it('should skip normal middleware if next is called with an error', function(done) {
			var m1 = function(req, res, next) {
				next(new Error('boom!'));
			};

			var m2 = function(req, res, next) {

			};

			var e1 = function(err, req, res, next) {
				res.end('e1');
			};

			app.use(m1);
			app.use(m2);
			app.use(e1);

			request(app).get('/').expect('e1').end(done);
		});
	});

	describe('App embedding as middleware', function() {
		var app;
		var subApp;
		beforeEach(function() {
			app = new express();
			subApp = new express();
		});

		it('should pass unhandled request to parent', function(done) {
			function m2(req, res, next) {
				res.end('m2');
			}
			app.use(subApp);
			app.use(m2);
			request(app).get('/').expect('m2').end(done);
		});

		it('should pass unhandled error to parent', function(done) {
			function m1(req, res, next) {
				next('m1 error');
			}

			function e1(err, req, res, next) {
				res.end(err);
			}

			subApp.use(m1);
			app.use(subApp);
			app.use(e1);
			request(app).get('/').expect('m1 error').end(done);
		});


	});
});