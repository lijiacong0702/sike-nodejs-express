var Layer =function(path, m) {
	this.handle = m;
	var reg = new RegExp(path + "/*");
	this.match = function(p) {
		if(reg.test(p)) {
			return {path : path};
		} else {
			return undefined;
		}
	};
}

module.exports = Layer;