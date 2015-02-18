/** @jsx React.DOM */
var FilterBox = require('./FilterBox'),
	LineChart = require('./LineChart'),
	Filter = require('../../../../src/js/lib/Filter');

var Root = React.createClass({
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
			data: {content: []},
			type: 'bandwidth'
		};
	},
	onFiltersChanged: function (filters) {
		this.setState({
			filters: filters
		});

		window.location.hash = Filter.serialize(filters);
	},
	onRangeChanged: function (unit) {
		if(this.request) this.request.abort();

		var units = {
			'hour': 'hours',
			'min': 'minutes',
			'sec': 'seconds'
		};

		this.request = $.getJSON('/logs/' + units[unit] + '.json', function (data) {
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
			<div id="root-container">
				<div>
					<TypePicker onChange={this.onTypeChanged}
						types={[
							{value: 'bandwidth', display:'Total Bandwidth (B)'},
							{value: 'requests', display: 'Request Count'}
						]}>
					</TypePicker>
					<RangePicker onChange={this.onRangeChanged}>
					</RangePicker>
				</div>
				<FilterBox onFiltersChanged={this.onFiltersChanged}
					filters={this.state.filters}>
				</FilterBox>
				<LineChart filters={this.state.filters}
					data={this.state.data}
					type={this.state.type}>
				</LineChart>
			</div>
		);
	}
});

module.exports = Root;