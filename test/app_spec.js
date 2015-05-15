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
});