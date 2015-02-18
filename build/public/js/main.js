(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/** @jsx React.DOM */
var Filter = require('../../../../src/js/lib/Filter');

var FilterBox = React.createClass({displayName: 'FilterBox',
	getDefaultProps: function () {
		return {
			filters: []
		}
	},
	addFilter: function (evt) {
		evt.preventDefault();
		var text = evt.target[0].value;
		var filters = this.props.filters.slice();
		filters.push(new Filter(text));
		this.props.onFiltersChanged(filters);
	},
	removeFilter: function (index) {
		this.props.filters.splice(index, 1);
		this.props.onFiltersChanged(this.props.filters);
	},
	render: function () {
		var filterItems = this.props.filters.map(function (filter, i) {
			return (
				React.DOM.li( {style:{background: filter.color}}, 
					React.DOM.button( {onClick:this.removeFilter.bind(this, i)}, "x"),
					filter.text
				)
			);
		}.bind(this));

		return (
			React.DOM.div( {className:"filter-box"}, 
				React.DOM.div( {className:"filter-form"}, 
					React.DOM.form( {onSubmit:this.addFilter}, 
						React.DOM.input( {type:"text"}),
						React.DOM.button( {type:"sumbit"}, "Add")
					)
				),
				React.DOM.ul( {className:"filter-list"}, 
					filterItems
				)
			)
		);
	}
});

module.exports = FilterBox;

},{"../../../../src/js/lib/Filter":4}],2:[function(require,module,exports){
/** @jsx React.DOM */
var LineChart = React.createClass({displayName: 'LineChart',
	getDefaultProps: function () {
		return {
			height: 600,
			width: 800,
			filters: [],
			data: {content: []}
		};
	},
	componentWillReceiveProps: function (newProps) {
		var canvas = this.getDOMNode();
		canvas.width = this.props.width;
		canvas.height = this.props.height;
		canvas.style = {};
		
		var ctx = canvas.getContext('2d');

		//resample data into discrete sets that will fit on screen
		var maxSamples = Math.floor(canvas.width / 40);
		var itemsPerSample = Math.floor(newProps.data.content.length / maxSamples);
		var i = 0;
		
		var data = [];
		var rawData = newProps.data.content.sort(function (a, b) {
			return a.time - b.time;
		});


		while(i < maxSamples) {
			var slice = rawData.slice(i*itemsPerSample, (i+1)*itemsPerSample);
			data.push(slice.reduce(function (a, b) {
				return {
					time: a.time || b.time,
					data: a.data.concat(b.data)
				};
			}, {time: 0, data: []}));
			i++;
		}


		var labels = data.map(function (entry) {
			var d = new Date(entry.time);
			return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + 
				d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()

		});

		var datasets = newProps.filters.map(function (filter) {
			return {
				label: filter.text,
				data: data.map(function (entry) {
					return entry.data.filter(function (request) {
						return filter.test(request.data.url);
					}).map(function (request) {
						return parseInt(request.data.size, 10);
					}).reduce(function (a, b) {
						return a + ~~(b);
					}, 0);
				}),
				strokeColor: filter.color,
				fillColor: 'rgba(0,0,0,0)'
			}
		});

		this.chart = new Chart(ctx).Line({
			labels: labels, 
			datasets: datasets
		});
	},
	render: function() {
		return (
			React.DOM.canvas( {className:"graph-box",
				width:this.props.width, 
				height:this.props.height}
			)
		);
	}
});

module.exports = LineChart;
},{}],3:[function(require,module,exports){
/** @jsx React.DOM */
var FilterBox = require('./FilterBox'),
	LineChart = require('./LineChart'),
	Filter = require('../../../../src/js/lib/Filter');

var Root = React.createClass({displayName: 'Root',
	request: null,
	getInitialState: function () {
		var filters;

		if(window.location.hash) {
			filters = Filter.deserialize(window.location.hash.substring(1));
		}

		return {
			filters: filters || [
				new Filter('/addthis_widget/'),
				new Filter('/\.png/'),
				new Filter('/\.css/'),
				new Filter('/\.js/'),
				new Filter('/.*/')
			],
			data: {content: []}
		};
	},
	onFiltersChanged: function (filters) {
		this.setState({
			filters: filters
		});

		window.location.hash = Filter.serialize(filters);
	},
	onRangeChanged: function (range) {
		if(this.request) this.request.abort();

		var query = [];
		if(range.start !== undefined) {
			query.push('start=' + range.start);
		}
		if(range.max !== undefined) {
			query.push('max=' + range.max);
		}
		if(range.end !== undefined) {
			query.push('end=' + range.end);
		}

		var qs = '?' + query.join('&');
		this.request = $.getJSON('/logs/seconds.json', function (data) {
			this.setState({data: data})
		}.bind(this));
	},
	componentWillMount: function () {
		if(this.request) this.request.abort();

		this.request = $.getJSON('/logs/seconds.json', function (data) {
			this.setState({data: data})
		}.bind(this));
	},
	render: function() {
		return (
			React.DOM.div( {id:"root-container"}, 
				FilterBox( {onFiltersChanged:this.onFiltersChanged,
					filters:this.state.filters}
				),
				LineChart( {filters:this.state.filters,
					data:this.state.data}
				)
			)
		);
	}
});

module.exports = Root;
},{"../../../../src/js/lib/Filter":4,"./FilterBox":1,"./LineChart":2}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
var Root = require('../../build/public/js/components/Root');

React.renderComponent(new Root({}), document.getElementById('root'));
},{"../../build/public/js/components/Root":3}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qc2NvdHQvcHJvamVjdHMvZmFzdGx5LW5vZGUtc3lzbG9nL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvanNjb3R0L3Byb2plY3RzL2Zhc3RseS1ub2RlLXN5c2xvZy9idWlsZC9wdWJsaWMvanMvY29tcG9uZW50cy9GaWx0ZXJCb3guanMiLCIvVXNlcnMvanNjb3R0L3Byb2plY3RzL2Zhc3RseS1ub2RlLXN5c2xvZy9idWlsZC9wdWJsaWMvanMvY29tcG9uZW50cy9MaW5lQ2hhcnQuanMiLCIvVXNlcnMvanNjb3R0L3Byb2plY3RzL2Zhc3RseS1ub2RlLXN5c2xvZy9idWlsZC9wdWJsaWMvanMvY29tcG9uZW50cy9Sb290LmpzIiwiL1VzZXJzL2pzY290dC9wcm9qZWN0cy9mYXN0bHktbm9kZS1zeXNsb2cvc3JjL2pzL2xpYi9GaWx0ZXIuanMiLCIvVXNlcnMvanNjb3R0L3Byb2plY3RzL2Zhc3RseS1ub2RlLXN5c2xvZy9zcmMvanMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIEZpbHRlciA9IHJlcXVpcmUoJy4uLy4uLy4uLy4uL3NyYy9qcy9saWIvRmlsdGVyJyk7XG5cbnZhciBGaWx0ZXJCb3ggPSBSZWFjdC5jcmVhdGVDbGFzcyh7ZGlzcGxheU5hbWU6ICdGaWx0ZXJCb3gnLFxuXHRnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZmlsdGVyczogW11cblx0XHR9XG5cdH0sXG5cdGFkZEZpbHRlcjogZnVuY3Rpb24gKGV2dCkge1xuXHRcdGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHZhciB0ZXh0ID0gZXZ0LnRhcmdldFswXS52YWx1ZTtcblx0XHR2YXIgZmlsdGVycyA9IHRoaXMucHJvcHMuZmlsdGVycy5zbGljZSgpO1xuXHRcdGZpbHRlcnMucHVzaChuZXcgRmlsdGVyKHRleHQpKTtcblx0XHR0aGlzLnByb3BzLm9uRmlsdGVyc0NoYW5nZWQoZmlsdGVycyk7XG5cdH0sXG5cdHJlbW92ZUZpbHRlcjogZnVuY3Rpb24gKGluZGV4KSB7XG5cdFx0dGhpcy5wcm9wcy5maWx0ZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0dGhpcy5wcm9wcy5vbkZpbHRlcnNDaGFuZ2VkKHRoaXMucHJvcHMuZmlsdGVycyk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBmaWx0ZXJJdGVtcyA9IHRoaXMucHJvcHMuZmlsdGVycy5tYXAoZnVuY3Rpb24gKGZpbHRlciwgaSkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0UmVhY3QuRE9NLmxpKCB7c3R5bGU6e2JhY2tncm91bmQ6IGZpbHRlci5jb2xvcn19LCBcblx0XHRcdFx0XHRSZWFjdC5ET00uYnV0dG9uKCB7b25DbGljazp0aGlzLnJlbW92ZUZpbHRlci5iaW5kKHRoaXMsIGkpfSwgXCJ4XCIpLFxuXHRcdFx0XHRcdGZpbHRlci50ZXh0XG5cdFx0XHRcdClcblx0XHRcdCk7XG5cdFx0fS5iaW5kKHRoaXMpKTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHRSZWFjdC5ET00uZGl2KCB7Y2xhc3NOYW1lOlwiZmlsdGVyLWJveFwifSwgXG5cdFx0XHRcdFJlYWN0LkRPTS5kaXYoIHtjbGFzc05hbWU6XCJmaWx0ZXItZm9ybVwifSwgXG5cdFx0XHRcdFx0UmVhY3QuRE9NLmZvcm0oIHtvblN1Ym1pdDp0aGlzLmFkZEZpbHRlcn0sIFxuXHRcdFx0XHRcdFx0UmVhY3QuRE9NLmlucHV0KCB7dHlwZTpcInRleHRcIn0pLFxuXHRcdFx0XHRcdFx0UmVhY3QuRE9NLmJ1dHRvbigge3R5cGU6XCJzdW1iaXRcIn0sIFwiQWRkXCIpXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpLFxuXHRcdFx0XHRSZWFjdC5ET00udWwoIHtjbGFzc05hbWU6XCJmaWx0ZXItbGlzdFwifSwgXG5cdFx0XHRcdFx0ZmlsdGVySXRlbXNcblx0XHRcdFx0KVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlckJveDtcbiIsIi8qKiBAanN4IFJlYWN0LkRPTSAqL1xudmFyIExpbmVDaGFydCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ0xpbmVDaGFydCcsXG5cdGdldERlZmF1bHRQcm9wczogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRoZWlnaHQ6IDYwMCxcblx0XHRcdHdpZHRoOiA4MDAsXG5cdFx0XHRmaWx0ZXJzOiBbXSxcblx0XHRcdGRhdGE6IHtjb250ZW50OiBbXX1cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzOiBmdW5jdGlvbiAobmV3UHJvcHMpIHtcblx0XHR2YXIgY2FudmFzID0gdGhpcy5nZXRET01Ob2RlKCk7XG5cdFx0Y2FudmFzLndpZHRoID0gdGhpcy5wcm9wcy53aWR0aDtcblx0XHRjYW52YXMuaGVpZ2h0ID0gdGhpcy5wcm9wcy5oZWlnaHQ7XG5cdFx0Y2FudmFzLnN0eWxlID0ge307XG5cdFx0XG5cdFx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdFx0Ly9yZXNhbXBsZSBkYXRhIGludG8gZGlzY3JldGUgc2V0cyB0aGF0IHdpbGwgZml0IG9uIHNjcmVlblxuXHRcdHZhciBtYXhTYW1wbGVzID0gTWF0aC5mbG9vcihjYW52YXMud2lkdGggLyA0MCk7XG5cdFx0dmFyIGl0ZW1zUGVyU2FtcGxlID0gTWF0aC5mbG9vcihuZXdQcm9wcy5kYXRhLmNvbnRlbnQubGVuZ3RoIC8gbWF4U2FtcGxlcyk7XG5cdFx0dmFyIGkgPSAwO1xuXHRcdFxuXHRcdHZhciBkYXRhID0gW107XG5cdFx0dmFyIHJhd0RhdGEgPSBuZXdQcm9wcy5kYXRhLmNvbnRlbnQuc29ydChmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0cmV0dXJuIGEudGltZSAtIGIudGltZTtcblx0XHR9KTtcblxuXG5cdFx0d2hpbGUoaSA8IG1heFNhbXBsZXMpIHtcblx0XHRcdHZhciBzbGljZSA9IHJhd0RhdGEuc2xpY2UoaSppdGVtc1BlclNhbXBsZSwgKGkrMSkqaXRlbXNQZXJTYW1wbGUpO1xuXHRcdFx0ZGF0YS5wdXNoKHNsaWNlLnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHRpbWU6IGEudGltZSB8fCBiLnRpbWUsXG5cdFx0XHRcdFx0ZGF0YTogYS5kYXRhLmNvbmNhdChiLmRhdGEpXG5cdFx0XHRcdH07XG5cdFx0XHR9LCB7dGltZTogMCwgZGF0YTogW119KSk7XG5cdFx0XHRpKys7XG5cdFx0fVxuXG5cblx0XHR2YXIgbGFiZWxzID0gZGF0YS5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG5cdFx0XHR2YXIgZCA9IG5ldyBEYXRlKGVudHJ5LnRpbWUpO1xuXHRcdFx0cmV0dXJuIChkLmdldE1vbnRoKCkgKyAxKSArICcvJyArIGQuZ2V0RGF0ZSgpICsgJyAnICsgXG5cdFx0XHRcdGQuZ2V0SG91cnMoKSArICc6JyArIGQuZ2V0TWludXRlcygpICsgJzonICsgZC5nZXRTZWNvbmRzKClcblxuXHRcdH0pO1xuXG5cdFx0dmFyIGRhdGFzZXRzID0gbmV3UHJvcHMuZmlsdGVycy5tYXAoZnVuY3Rpb24gKGZpbHRlcikge1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0bGFiZWw6IGZpbHRlci50ZXh0LFxuXHRcdFx0XHRkYXRhOiBkYXRhLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcblx0XHRcdFx0XHRyZXR1cm4gZW50cnkuZGF0YS5maWx0ZXIoZnVuY3Rpb24gKHJlcXVlc3QpIHtcblx0XHRcdFx0XHRcdHJldHVybiBmaWx0ZXIudGVzdChyZXF1ZXN0LmRhdGEudXJsKTtcblx0XHRcdFx0XHR9KS5tYXAoZnVuY3Rpb24gKHJlcXVlc3QpIHtcblx0XHRcdFx0XHRcdHJldHVybiBwYXJzZUludChyZXF1ZXN0LmRhdGEuc2l6ZSwgMTApO1xuXHRcdFx0XHRcdH0pLnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0XHRcdFx0cmV0dXJuIGEgKyB+fihiKTtcblx0XHRcdFx0XHR9LCAwKTtcblx0XHRcdFx0fSksXG5cdFx0XHRcdHN0cm9rZUNvbG9yOiBmaWx0ZXIuY29sb3IsXG5cdFx0XHRcdGZpbGxDb2xvcjogJ3JnYmEoMCwwLDAsMCknXG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNoYXJ0ID0gbmV3IENoYXJ0KGN0eCkuTGluZSh7XG5cdFx0XHRsYWJlbHM6IGxhYmVscywgXG5cdFx0XHRkYXRhc2V0czogZGF0YXNldHNcblx0XHR9KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0UmVhY3QuRE9NLmNhbnZhcygge2NsYXNzTmFtZTpcImdyYXBoLWJveFwiLFxuXHRcdFx0XHR3aWR0aDp0aGlzLnByb3BzLndpZHRoLCBcblx0XHRcdFx0aGVpZ2h0OnRoaXMucHJvcHMuaGVpZ2h0fVxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmVDaGFydDsiLCIvKiogQGpzeCBSZWFjdC5ET00gKi9cbnZhciBGaWx0ZXJCb3ggPSByZXF1aXJlKCcuL0ZpbHRlckJveCcpLFxuXHRMaW5lQ2hhcnQgPSByZXF1aXJlKCcuL0xpbmVDaGFydCcpLFxuXHRGaWx0ZXIgPSByZXF1aXJlKCcuLi8uLi8uLi8uLi9zcmMvanMvbGliL0ZpbHRlcicpO1xuXG52YXIgUm9vdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtkaXNwbGF5TmFtZTogJ1Jvb3QnLFxuXHRyZXF1ZXN0OiBudWxsLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgZmlsdGVycztcblxuXHRcdGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG5cdFx0XHRmaWx0ZXJzID0gRmlsdGVyLmRlc2VyaWFsaXplKHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGZpbHRlcnM6IGZpbHRlcnMgfHwgW1xuXHRcdFx0XHRuZXcgRmlsdGVyKCcvYWRkdGhpc193aWRnZXQvJyksXG5cdFx0XHRcdG5ldyBGaWx0ZXIoJy9cXC5wbmcvJyksXG5cdFx0XHRcdG5ldyBGaWx0ZXIoJy9cXC5jc3MvJyksXG5cdFx0XHRcdG5ldyBGaWx0ZXIoJy9cXC5qcy8nKSxcblx0XHRcdFx0bmV3IEZpbHRlcignLy4qLycpXG5cdFx0XHRdLFxuXHRcdFx0ZGF0YToge2NvbnRlbnQ6IFtdfVxuXHRcdH07XG5cdH0sXG5cdG9uRmlsdGVyc0NoYW5nZWQ6IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRmaWx0ZXJzOiBmaWx0ZXJzXG5cdFx0fSk7XG5cblx0XHR3aW5kb3cubG9jYXRpb24uaGFzaCA9IEZpbHRlci5zZXJpYWxpemUoZmlsdGVycyk7XG5cdH0sXG5cdG9uUmFuZ2VDaGFuZ2VkOiBmdW5jdGlvbiAocmFuZ2UpIHtcblx0XHRpZih0aGlzLnJlcXVlc3QpIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xuXG5cdFx0dmFyIHF1ZXJ5ID0gW107XG5cdFx0aWYocmFuZ2Uuc3RhcnQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cXVlcnkucHVzaCgnc3RhcnQ9JyArIHJhbmdlLnN0YXJ0KTtcblx0XHR9XG5cdFx0aWYocmFuZ2UubWF4ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHF1ZXJ5LnB1c2goJ21heD0nICsgcmFuZ2UubWF4KTtcblx0XHR9XG5cdFx0aWYocmFuZ2UuZW5kICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHF1ZXJ5LnB1c2goJ2VuZD0nICsgcmFuZ2UuZW5kKTtcblx0XHR9XG5cblx0XHR2YXIgcXMgPSAnPycgKyBxdWVyeS5qb2luKCcmJyk7XG5cdFx0dGhpcy5yZXF1ZXN0ID0gJC5nZXRKU09OKCcvbG9ncy9zZWNvbmRzLmpzb24nLCBmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7ZGF0YTogZGF0YX0pXG5cdFx0fS5iaW5kKHRoaXMpKTtcblx0fSxcblx0Y29tcG9uZW50V2lsbE1vdW50OiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYodGhpcy5yZXF1ZXN0KSB0aGlzLnJlcXVlc3QuYWJvcnQoKTtcblxuXHRcdHRoaXMucmVxdWVzdCA9ICQuZ2V0SlNPTignL2xvZ3Mvc2Vjb25kcy5qc29uJywgZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe2RhdGE6IGRhdGF9KVxuXHRcdH0uYmluZCh0aGlzKSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdFJlYWN0LkRPTS5kaXYoIHtpZDpcInJvb3QtY29udGFpbmVyXCJ9LCBcblx0XHRcdFx0RmlsdGVyQm94KCB7b25GaWx0ZXJzQ2hhbmdlZDp0aGlzLm9uRmlsdGVyc0NoYW5nZWQsXG5cdFx0XHRcdFx0ZmlsdGVyczp0aGlzLnN0YXRlLmZpbHRlcnN9XG5cdFx0XHRcdCksXG5cdFx0XHRcdExpbmVDaGFydCgge2ZpbHRlcnM6dGhpcy5zdGF0ZS5maWx0ZXJzLFxuXHRcdFx0XHRcdGRhdGE6dGhpcy5zdGF0ZS5kYXRhfVxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUm9vdDsiLCJ2YXIgRmlsdGVyID0gZnVuY3Rpb24gKHRleHQpIHtcblx0dGhpcy50ZXh0ID0gdGV4dDtcblx0dGhpcy5yZWdleCA9IGV2YWwodGV4dCk7XG5cdHRoaXMuY29sb3IgPSBnZXROZXh0Q29sb3IoKTtcbn07XG5cbkZpbHRlci5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uIChzdHJpbmcpIHtcblx0cmV0dXJuIHRoaXMucmVnZXgudGVzdChzdHJpbmcpO1xufTtcblxuRmlsdGVyLnNlcmlhbGl6ZSA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG5cdHZhciBzdHIgPSBKU09OLnN0cmluZ2lmeShmaWx0ZXJzLm1hcChmdW5jdGlvbiAoZmlsdGVyKSB7XG5cdFx0cmV0dXJuIGZpbHRlci50ZXh0O1xuXHR9KSk7XG5cblx0cmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xufVxuXG5GaWx0ZXIuZGVzZXJpYWxpemUgPSBmdW5jdGlvbiAoc3RyKSB7XG5cdHRyeSB7XG5cdFx0dmFyIGZpbHRlcnMgPSBKU09OLnBhcnNlKGRlY29kZVVSSUNvbXBvbmVudChzdHIpKTtcblx0XHRyZXR1cm4gZmlsdGVycy5tYXAoZnVuY3Rpb24gKGZpbHRlcikge1xuXHRcdFx0cmV0dXJuIG5ldyBGaWx0ZXIoZmlsdGVyKTtcblx0XHR9KTtcblx0fVxuXHRjYXRjaChlKSB7XG5cdFx0Y29uc29sZS5lcnJvcihcImNvdWxkbnQgcGFyc2UuXCIsIGUuc3RhY2spO1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cbn1cblxudmFyIHI9MCwgZz0xMDAsIGI9MjAwO1xuZnVuY3Rpb24gZ2V0TmV4dENvbG9yICgpIHtcblx0ciArPSAxNTE7XG5cdGcgKz0gNzM7XG5cdGIgKz0gMTc7XG5cblx0ciAlPSAyNTU7XG5cdGIgJT0gMjU1O1xuXHRnICU9IDI1NTtcblx0cmV0dXJuICdyZ2IoJyArIHIgKyAnLCcgKyBiICsgJywnICsgZyArICcpJztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXI7IiwidmFyIFJvb3QgPSByZXF1aXJlKCcuLi8uLi9idWlsZC9wdWJsaWMvanMvY29tcG9uZW50cy9Sb290Jyk7XG5cblJlYWN0LnJlbmRlckNvbXBvbmVudChuZXcgUm9vdCh7fSksIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JykpOyJdfQ==
