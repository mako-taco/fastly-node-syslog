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