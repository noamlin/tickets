"use strict";
var paypal = require('paypal-rest-sdk');
var mailer = require('../mailer');
module.exports.IPNHandler = require('./ipn');

//permanent mail-related veriables
var SENDER = "The Ticket <system@the-ticket.com>";
var ADMIN = "omerozery@gmail.com";

/*******************
Configure Paypal SDK
********************/
exports.configurePaypal = function() {
	paypal.configure({
		'host': 'api.sandbox.paypal.com',
		'port': '',
		'client_id': 'AbyGsxBUuERfvvukrRzMnL4zu0DyGiKcI8Tk0QxyYwuZITUm8jVu0GnDLj11',
		'client_secret': 'EBWr4hAF2dmZZ1bq5kvql41VWEQc88_rGp2pwriWTid701I7BXPLZOggIgud'
	});
};

/*************************
Create Paypal Payment Json
**************************/
exports.createPayment = function(req, res) {

	var purchase = req.purchase;

	//Building Paypal Payment Json Request
	var payment = {
    "intent": "sale",
    "payer": {
      "payment_method": "paypal"
    },
		"transactions": [{
			"amount": {
				"total":  purchase.amount.total,
				"currency": purchase.currency,
			},
			"item_list": {
				"items": [{
					"quantity": purchase.quantity.total,
					"price": purchase.ticket.final_price,
					"name": purchase.ticket.name,
					"currency": purchase.currency,
				}]
			},
		}],
		"redirect_urls": {
		"return_url": "http://localhost/execute",
		"cancel_url": "http://localhost/cancel"
		},
	}
	if(purchase.payment_type == "authorize") {
		payment.intent = "authorize";
	}
	
  paypal.payment.create(payment, function (err, payment) {
    if(err) {
      console.log(err);
    } else {
      req.session.paymentID = payment.id;
      res.render('create', { 'payment': payment });
    }
  });
};

/***************************
Execute a paypal transaction
****************************/
exports.executePayment = function(req, res) {

	var paymentID = req.session.paymentID;
	var payerID = { "payer_id": req.param('PayerID') };

	paypal.payment.execute(paymentID, payerID, function (err, payment) {
		if (err) {
			console.log(err);
    } else {
			res.render('execute', { 'payment': payment });
		}
	});
};

/**************************
Cancel a paypal transaction
***************************/
exports.cancelPayment = function(req, res) {
	res.render("cancel");
};

/**********************
Refund a paypal Payment
***********************/
//local function for handaling paypal's refund's state (sending mails and accordinly)
/*function refundStatusHandler(refundState, purchaseID) {

	//permanent veriables
	var FUNCTION = "Paypal::Index::StatusHandler";

	//permanent state veriables
	var COMPLETED = "completed"; 
	var PENDING = "pending";
	var FAILED = "failed";
	var ERR="error";

	if(refundState == COMPLETED || refundState == PENDING) {
	} else {
		switch (refundState) {
		case FAILED:
			console.log(FUNCTION + " Error : paypal's refund function was successful but refund failed with no reason for purchase: " + purchaseID);
			var body = "Error : paypal's refund function was successful but refund failed with no reason for purchase: " + purchaseID;
			break;
		case ERR:
			console.log(FUNCTION + " Error : paypal's refund function was not successful and returned and error object for purchase: " + purchaseID);
			var body = "Error : paypal's refund function was not successful and returned and error object for purchase: " + purchaseID;
			break;  
		default:
			console.log(FUNCTION + " Error : unkown refund state : " + refundState + " recived while trying to refund purchase: " + purchaseID);
			var body = "Error : unkown refund state : " + refundState + " recived while trying to refund purchase: " + purchaseID;
		}
		//Notify the admin by mail about any of the refund states(other then 'completed or pending');
		mailer.SendMail(SENDER, ADMIN, 'Notification from ' + FUNCTION, body);
	}
}*/
exports.refundPayment = function(req, res) {
	
	var purchase = req.purchase;

	//Building Paypal refund Json Request
	var refund = {
		"amount": {
			"currency": purchase.currency,
			"total": purchase.refund.amount
		}
	};
	
	if(purchase.payment_type == "authorize") {
		paypal.capture.refund(purchase.paypal.txn_id, refund, function(err, refund){
			if(err){
				console.log(err);
			} else {
				console.log(refund);
			}
		});
	}	else {
		paypal.sale.refund(purchase.paypal.txn_id, refund, function(err, refund){
			if(err){
				console.log(err);
			} else {
				console.log(refund);
			}
		});
	}
};

/**********************
Capture a paypal Payment
***********************/
exports.capturePayment = function(req, res) {

	var purchase = req.purchase;

	//Building Paypal Capture Json Request
	var capture = {
		"amount": {
		  "currency": purchase.currency,
		  "total":  purchase.amount.total
		},
		"is_final_capture": true
	};

	paypal.authorization.capture(purchase.paypal.txn_id, capture, function(err, capture){
		if(err){
		  console.log(err);
		} else {
		  console.log(capture);
		}
	});
}

/********************
Void a paypal Payment
*********************/
exports.voidPayment = function(req, res) {

	var purchase = req.purchase;

	paypal.authorization.void(purchase.paypal.txn_id, function(err, authorization){
		if(err){
		  console.log(err);
		} else {
		  console.log(authorization);
		}
	});
}
