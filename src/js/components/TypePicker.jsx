/** @jsx React.DOM */
var TypePicker = React.createClass({
	propTypes: {
		onChange: React.PropTypes.func.isRequired,
		types: React.PropTypes.array.isRequired
	},
	onChange: function (evt) {
		this.props.onChange(evt.target.value);
	},
	render: function () {
		var options = this.props.types.map(function (type) {
			return <option value={type.value}>{type.display}</option>
		});

		return (
			<div>
				<div>
					<label>Type</label>
					<select onChange={this.onChange}>
						{options}
					</select>
				</div>
			</div>
		);
	}
});

module.exports = TypePicker;