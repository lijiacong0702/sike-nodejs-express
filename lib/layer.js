var p2re = require('path-to-regexp');
var Layer =function(path, m) {
	this.handle = m;
	// strip trialing slash
	path = path[path.length-1]==='/' ? path.substring(0, path.length-1) : path;
	//var reg = new RegExp(path + "/*");
	var names = [];
	var reg = p2re(path, names, {end:false});
	this.match = function(p) {
		var result, testResult, i;
		testResult = reg.exec(p);
		if(testResult) {
			result = {};
			result['path'] = decodeURIComponent(testResult[0]);
			result['params'] = {};
			for(i=0; i<names.length; i++) {
				result.params[names[i].name] = decodeURIComponent(testResult[i+1]);
			}
		}
		return result;
	};
}

module.exports = Layer;