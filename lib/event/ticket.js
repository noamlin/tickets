var mdb = require('../mdb');
//permanent veriables
var EVENTS = "events";

exports.increase = function (req, res) {

  req.collection = EVENTS;
  req.query = {'_id': req.eventID };
  req.update = { $inc : {} };
  req.update.$inc['sub_events.' + req.ticketP[0] + '.tickets.' + req.ticketP[1] + '.purchased'] = req.quantity;
  mdb.update(req, res);
}

exports.decrease = function (req, res) {

	req.quantity = -quantity;
	this.increase(req, res);	
}

