/**
 * Alows subscrubing to events, emitting events. This should
 * generally be used as an object's prototype, instead of a stand
 * alone instance.
 *
 * @constructor
 * @prop {object} listeners - a dynamic map of event 'types' to 
 *	the functions registered to handle those events.
 */
var EventEmitter = function () {
	this.listeners = {};
};

/**
 * Add a handler for a message type 
 *
 * @param {string} type - message type
 * @param {function} fn - handler to add
 */
EventEmitter.prototype.on = function (type, fn, ctx) {
	var wrapped;

	ctx = ctx || this;	
	wrapped = function () {
		fn.apply(ctx, Array.prototype.slice.call(arguments, 0));
	};

	fn.wrapped = wrapped;

	if(!this.listeners[type]) {
		this.listeners[type] = [wrapped];
	}
	else {
		this.listeners[type].push(wrapped);
	}
};

/**
 * Add a handler for a message type which removes itself
 * after a single execution
 *
 * @param {string} type - message type
 * @param {function} fn - handler to add
 */
EventEmitter.prototype.once = function (type, fn, ctx) {
	var wrapped;

	ctx = ctx || this;

	wrapped = function () {
		ctx.off(type, fn);
		fn.apply(ctx, Array.prototype.slice(arguments, 0));
	};

	fn.wrapped = wrapped;

	if(!this.listeners[type]) {
		this.listeners[type] = [wrapped];
	}
	else {
		this.listeners[type].push(wrapped);
	}	
};

/**
 * Remove a handler for a message type 
 *
 * @param {string} type - message type
 * @param {function} fn - handler to remove
 */
EventEmitter.prototype.off = function (type, fn) {
	var index, index2;

	if(this.listeners[type]) {
		index = this.listeners[type].indexOf(fn);
		index2 = this.listeners[type].indexOf(fn.wrapped);
		if(index > -1) {
			this.listeners[type].splice(index, 1);
			return true;
		}
		else if(index2 > -1) {
			this.listeners[type].splice(index2, 1);
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
};

/**
 * Triggers an event of a specific type, with any additional payload 
 * passed.
 *
 * @param {string} type - the type of event to emit
 * @param {...(object|number|string)} payload - Any additional arguments
 *	will be sent to the handlers for this event
 */
EventEmitter.prototype.emit = function (type) {
	var payload = Array.prototype.slice.call(arguments, 1),
		fns = this.listeners[type] || [],
		i;

	for(i=0; i<fns.length; i++) {
		fns[i].apply(this, payload);
	}
};

module.exports = EventEmitter;