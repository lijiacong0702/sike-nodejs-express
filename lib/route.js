// var makeRoute = function(verb, handler) {
// 	return function(req, res, next) {
// 		if(req.method === verb.toUpperCase()) {
// 			handler(req, res, next);
// 		} else {
// 			next();
// 		}
// 	}
// }

var makeRoute = function() {
	var route = function(req, res, next){
		var i = -1, layer;
		function next(err) {
			if(err) {
				res.statusCode = 500;
				return;
			} else {
				i++;
				layer = route.stack[i];
				if(layer) {
					if(layer.verb.toUpperCase() === req.method || "all" === layer.verb) {
						try {
							layer.handler(req, res, next);
						} catch(e) {
							next(e);
						}
					} else {
						next();
					}
				} else {
					res.statusCode = 404;
					return;
				}
			}
		};

		next();
	};
	route.stack = [];
	route.use = function(verb, handler) {
		var temp = {};
		temp.verb = verb;
		temp.handler = handler;
		route.stack.push(temp);
	};

	var methods = require('methods').concat("all");
	methods.forEach(function(method) {
		route[method] = function(handler) {
			route.use(method, handler);
			return route;
		}
	});
	return route;
};



module.exports = makeRoute;