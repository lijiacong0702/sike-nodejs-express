var createInjector = function(handler, app){
	var injector = function(req, res, next) {
		var loader = injector.dependencies_loader(req, res, next);
		loader(function(err, values) {
			if(err) {
				next(err);
			} else {
				handler.apply(this, values);
			}
		});
	};

	injector.params = [];
	injector.extract_params = function() {
		var fnText = handler.toString();
		var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
		        FN_ARG_SPLIT   = /,/,
		        FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/,
		        STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

		var argDecl = fnText.replace(STRIP_COMMENTS, '').match(FN_ARGS);
		argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
			arg.replace(FN_ARG, function(all, underscore, name) {
				injector.params.push(name);
			});
		});
		return injector.params;
	};

	injector.dependencies_loader = function(req, res, next2) {
		// recursive next function to call the factories
		var params = injector.extract_params();
		var factories = app._factories;
		injector.values = [];
		var i = -1;
		function next(err, value) {
			var param, fn;
			if(value) {
				injector.values.push(value);
			}
			if(err) {
				throw err;
			}
			i++;
			if(i === params.length) {
				return;
			}
			param = params[i];
			if(param === 'req' || param === 'res' || param === 'next') {
				next(err, null);
				return;
			}
			fn = factories[param];
			if(fn) {
				fn(req, res, next);
				return;
			}else {
				throw new Error("Factory not defined: "+param);
			}
		}

		// builtin dependencies
		params.forEach(function(param) {
			if(param === 'req' || param === 'res' || param ==='next') {
				if(param === 'req') {
					injector.values.push(req);
				}
				if(param === 'res') {
					injector.values.push(res);
				}
				if(param === 'next') {
					injector.values.push(next2);
				}
			}
		});

		return function(cb) {
			try {
				next(null, null);
				cb(null, injector.values);
			} catch(e) {
				cb(e, injector.values);
			}
		};
	};

	return injector;
};

module.exports = createInjector;