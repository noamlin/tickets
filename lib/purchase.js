var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var validate = require('./validate/index');
var paypal = require('./paypal/index');
var stripe = require('./stripe/index');
var eventHandler = require('./event/index');
var purchaseHandler = require('./purchase.js');
var mdb = require('./mdb.js');


//permanent veriables 
var PURCHASES = 'purchases';

//local function for single ticket'a final price calculation
function ticketPriceCalc (ticket, coupon) {
	if(coupon) {
		if(coupon.type == 'fixed') {
			return ticket.price-coupon.rate
		}
		if(coupon.type == 'percentage') {
			return ticket.price*(1-coupon.rate/100)
		}
	}
	return ticket.price
}

//local function to create purchase document
function createPurchase(purchaseReq, event) {

	//defines general veriables
	var payBy = purchaseReq.payBy; 
	var ticketP = purchaseReq.ticketP;
	var couponP = purchaseReq.couponP;
	var cellphone = purchaseReq.cellphone;
	var email = purchaseReq.email;
	var quantity = purchaseReq.quantity;
	var fieldsValues = purchaseReq.fieldsValues
	var fieldsAttributes = event.fields;
	var ticket = event.sub_events[ticketP[0]].tickets[ticketP[1]];
	var coupon = event.coupons[couponP];

	//sets some of the veriables (only the ones that needs to be set) for bulding accurate purchase document;
	quantity = parseInt(quantity);
	ticketP = [parseInt(ticketP[0]),parseInt(ticketP[1])];
	var ticketFinalPrice = parseFloat(ticketPriceCalc(ticket, coupon)).toFixed(2);
	var totalFinalPrice = parseFloat(ticketFinalPrice*quantity).toFixed(2); // is not entering as float !!!!!!!!!!!

	//builds purchase document
	var purchaseID = new ObjectID();
	var purchase = {
		"_id": purchaseID,
		"event_id": event._id,
		"status": "not-paid",
		"email": email,
		"currency" : event.currency,
		"payment_type" : event.payment_type,
		"fields": []
	}
	purchase.ticket = {
		"final_price" : ticketFinalPrice,
		"pointer" : ticketP,
		"name" : ticket.name,
		"original_price" : ticket.price,
	}
	purchase.quantity = {
		"total" : quantity,
		"refunded" : 0,
		"used" : 0,
	}
	purchase.amount = {
		"total" :  totalFinalPrice,
		"refunded" : 0,
	}
	//checks for coupon
	if(coupon) {
		purchase.coupon = {
			"pointer": parseInt(couponP),
			"type": coupon.type,
			"rate": coupon.rate
		}
	}
	//checks for cellphone
	if(event.send_sms) {
		purchase.cellphone = cellphone;
	}

	//inserts fields
	for(var field = 0 ; field < fieldsAttributes.length ; field++) {
		purchase.fields[field] = {
			"name": fieldsAttributes[field].name,
		}
		if(fieldsAttributes[field].type == 'date') {
			purchase.fields[field].value = parseInt(fieldsValues[field]);
		} else {
			purchase.fields[field].value = fieldsValues[field].toString();
		}
	}
	purchase[payBy] = {};
	return purchase;
}

/**************************
Insert Purchase To Database 
***************************/
exports.insert = function(req, res) {
	
  req.collection = PURCHASES;
	req.insert = req.purchase;
	mdb.insert(req, res);
}

/*
Notes:
1. selectbox only string values entered to the purchase document (because you can never know what type of values the admin ment to put in the select box options)
2. digits type fields that are given to me not as an int bigger then 22 digits (+-) are not passed validation (nothing to do about it)
3. date type field (if empty) are given the int 0 while putted in database (because they are the only ones that inserted to db as integer.
4. digits and phone fields are saved as string in database (and are completly the same so what do we need both types, ask noam)
5. if purchase document isnt inserted to purchase's collection program doesnt proceed to updating event and coupon on events collections and if that isnt happaned programm doesnt procced to create payment functions (paypal or stripe) is it good ? or should we change it to work simultaneously unsynchronize

Problems:
1. need to improve cellphone validation! (does it suppose to be with '+'? and does it supposed to be saved as int or string)
2. pronlem with enlargeing coupon usage and ticket usage (multiply task simultaneously consult with noam
3. consult with noam about sending all the event in validation in validator.Event and validator.TicketP functions

*/

/*****************
Creating Purchases
******************/
exports.create = function(req, res) {

	//only for demenstration
	req.session.purchaseReq = {
		"eventID" : "5356efed9f841183075124de", 
		"payBy" : 'paypal',// ✔ stripe or paypal // //vonrable from here also
		"ticketP" : [1,0], // ✔
		"couponP" : 0, //✔ - invalid couponP = no coupon at all!
		"cellphone" : "+3333434343434",
		"email" : "omerozer@gmail.com", //✔
		"quantity" : "12" , //✔
		"fieldsValues" : ["blabl@dsa.coma","edasd",432,"blablaasdasdas334","avikam",""], //✔
	}
	//permanent veriables
	var FUNCTION = "Purchase::Handle";
	var DOCTYPE = "event";

	//json answer to Client
	var jsonAnswer = { "status": "success" }

	try {
		var purchaseReq = req.session.purchaseReq;
		var eventID = new ObjectID(purchaseReq.eventID);
	} catch (err) {
		console.log(err)
	}

	var MongoClient = mongodb.MongoClient;
	MongoClient.connect("mongodb://localhost:27017/tickets", function(err, db) {
		if(err) {
			console.log(err);
		} else {
			console.log(FUNCTION + ' : A connection to the database has been made using mongoClient');
			db.collection('events').findOne({ '_id': eventID } , function(err, event) {
				if(err) {
					console.log(err);
				} else {
					
					//validate event
					jsonAnswer = validate.doc(event, DOCTYPE, jsonAnswer);
					if(!jsonAnswer.event) {

						//validate purchase's request's details
						jsonAnswer = validate.purchase(purchaseReq, event, jsonAnswer);

					//if the event wasn't found logging and sending mail to the admin about it
					} else {
						console.log(FUNCTION + ' Error : ' + DOCTYPE + ' ' + eventID + ' cant be found in database');
						//mailer.sendMail(SENDER, ADMIN,'Notification from ' + FUNCTION, 'Error : ' + DOCTYPE + ' ' + eventID + ' cant be found in database');
					}

					//if validations failed
					if(Object.keys(jsonAnswer).length > 1) {
						jsonAnswer.status = "failed";
						console.log(jsonAnswer);

					//if validations was successful
					} else {
						
						//creating purchase document using CreatePurchase function
						var purchase = createPurchase(purchaseReq, event);
					
						//inserts purchase document to database using InsertPurchase
						req.db = db;
						req.purchase = purchase;
						purchaseHandler.insert(req, res);
					 	//increases ticket's purchased and coupon's times_used (if exists) by quantity and updating the event (using event module's functions)
						req.eventID = purchase.event_id;
						req.quantity = purchase.quantity.total;
						req.ticketP = purchase.ticket.pointer;
						//event = eventHandler.ticketUp(event, purchase.ticket.pointer, purchase.quantity.total);
						eventHandler.ticket.increase(req, res);
						if(purchase.coupon) {
						req.couponP = purchase.coupon.pointer
							//event = eventHandler.couponUp(event, purchase.coupon.pointer, purchase.quantity.total);
							eventHandler.coupon.increase(req, res);
						}
						//eventHandler.updateEvent(event, db);
						//"uploading" purchase to req
						req.purchase = purchase;

						//proceed to paypal/stripe CreatePayment
						if(purchase.paypal) {
							paypal.createPayment(req, res);
						}
						if(purchase.stripe) {
							stripe.createPayment(req, res);
						}
					}   
				}
			});
		}
	});
}

