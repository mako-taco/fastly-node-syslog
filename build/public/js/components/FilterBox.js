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
