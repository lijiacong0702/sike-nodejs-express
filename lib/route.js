var makeRoute = function(verb, handler) {
	return function(req, res, next) {
		if(req.method === verb.toUpperCase()) {
			handler(req, res, next);
		} else {
			next();
		}
	}
}

module.exports = makeRoute;