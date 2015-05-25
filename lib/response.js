var response = function(obj) {
	var proto = {};
	proto.isExpress = true;
	proto.__proto__ = obj.__proto__;
	return proto;
};

module.exports = response;