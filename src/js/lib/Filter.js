var Filter = function (text) {
	this.text = text;
	this.regex = eval(text);
	this.color = getNextColor();
};

Filter.prototype.test = function (string) {
	return this.regex.test(string);
};

Filter.serialize = function (filters) {
	var str = JSON.stringify(filters.map(function (filter) {
		return filter.text;
	}));

	return encodeURIComponent(str);
}

Filter.deserialize = function (str) {
	try {
		var filters = JSON.parse(decodeURIComponent(str));
		return filters.map(function (filter) {
			return new Filter(filter);
		});
	}
	catch(e) {
		console.error("couldnt parse.", e.stack);
		return undefined;
	}
}

var r=0, g=100, b=200;
function getNextColor () {
	r += 151;
	g += 73;
	b += 17;

	r %= 255;
	b %= 255;
	g %= 255;
	return 'rgb(' + r + ',' + b + ',' + g + ')';
}

module.exports = Filter;