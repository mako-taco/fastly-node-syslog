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