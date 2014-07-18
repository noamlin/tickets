module.exports.ticket = require('./ticket');
module.exports.coupon = require('./coupon');

/***************************
Increases Ticket By Quantity
****************************/
exports.ticketUp = function(event, ticketP, quantity) {

	//permanent veriables
	var FUNCTION = "Event::TicketUp";

	event.sub_events[ticketP[0]].tickets[ticketP[1]].purchased = event.sub_events[ticketP[0]].tickets[ticketP[1]].purchased+quantity;
	console.log(FUNCTION + " : ticket was updated up for event " + event._id);
	return event;
}

/***************************
Decreases Ticket By Quantity
****************************/
exports.ticketDown = function(event, ticketP, quantity) {

	//permanent veriables
	var FUNCTION = "Event::TicketDown";

	event.sub_events[ticketP[0]].tickets[ticketP[1]].purchased = event.sub_events[ticketP[0]].tickets[ticketP[1]].purchased-quantity;
	console.log(FUNCTION + " : ticket was updated down for event " + event._id);
	return event;
}

/***************************
Increases Coupon By Quantity
****************************/
exports.couponUp = function(event, couponP, quantity) {

	//permanent veriables
	var FUNCTION = "Event::CouponUp";

	event.coupons[couponP].times_used = event.coupons[couponP].times_used+quantity;
	console.log(FUNCTION + " : coupon was updated up for event " + event._id);
	return event;
}

/***************************
Decreases Coupon By Quantity
****************************/
exports.couponDown = function(event, couponP, quantity) {

	//permanent veriables
	var FUNCTION = "Event::CouponDown";

	event.coupons[couponP].times_used = event.coupons[couponP].times_used-quantity;
	console.log(FUNCTION + " : coupon was updated down for event " + event._id);
	return event;
}

/**********************************
Update A Specific Event In Database
***********************************/
exports.updateEvent = function(event, db) {

	//permanent veriables
	var FUNCTION = "Event::UpdateEvent";

	//extracting the event id from the event document
	eventID = event._id;
	delete event["_id"];

	//updating event in databse (only the sub documents speficied in the event veriable)
	db.collection('events').update({ '_id': eventID } ,{ $set : event }, function(err, records) {
		if(err) {
			console.log(err);
		} else {
			//logging for updating event
			console.log(FUNCTION + " : event " + eventID + " was updated");
		}
	});
}
