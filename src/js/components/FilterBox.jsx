/** @jsx React.DOM */
var Filter = require('../../../../src/js/lib/Filter');

var FilterBox = React.createClass({
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
				<li style={{background: filter.color}}>
					<button onClick={this.removeFilter.bind(this, i)}>x</button>
					{filter.text}
				</li>
			);
		}.bind(this));

		return (
			<div className="filter-box">
				<div className="filter-form">
					<form onSubmit={this.addFilter}>
						<input type="text"></input>
						<button type="sumbit">Add</button>
					</form>
				</div>
				<ul className="filter-list">
					{filterItems}
				</ul>
			</div>
		);
	}
});

module.exports = FilterBox;
