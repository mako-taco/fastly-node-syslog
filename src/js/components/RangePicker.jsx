/** @jsx React.DOM */
var RangePicker = React.createClass({
	propTypes: {
		onChange: React.PropTypes.func.isRequired
	},
	onChange: function (evt) {
		this.props.onChange(evt.target.value);
	},
	render: function () {
		return (
			<div>
				<div>
					<label>Unit</label>
					<select onChange={this.onChange}>
						<option value="hour">Hour</option>
						<option value="min">Minute</option>
						<option value="sec" selected>Second</option>
					</select>
				</div>
			</div>
		);
	}
});

module.exports = RangePicker;