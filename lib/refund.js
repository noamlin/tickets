var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var validate = require('./validate/index');
var mailer = require('./mailer');
var paypal = require('./paypal/index');
var stripe = require('./stripe/index');

//local function to create refund document
function createRefund(refundReq, purchase) {

	var quantity = parseInt(refundReq.quantity)
	var refund = {
		"quantity" : quantity,
		"amount" : parseFloat(purchase.ticket.final_price*quantity).toFixed(2)
	}
	return refund;
}

/*************************
Executing Refunds Requests
**************************/
exports.execute = function(req, res) {

	//only for demenstration
	req.session.refundReq = { 
		"purchaseID" : "535079cf30f87e760e8ba177",
		"quantity" : "1",
	}
	//permanent general veriables
	var FUNCTION = "Refund::Execute";
	var DOCTYPE = "purchase";

	//json answer to Client
	var jsonAnswer = { "status": "success" }

	try {
		var refundReq = req.session.refundReq;
		var purchaseID = new ObjectID(refundReq.purchaseID);
	} catch (err) {
		console.log(err)
	}

	var MongoClient = mongodb.MongoClient;
	MongoClient.connect("mongodb://localhost:27017/tickets", function(err, db) {
		if(err) {
			console.log(err);
		} else {
			console.log(FUNCTION + ' : A connection to the database has been made using mongoClient');
			db.collection('purchases').findOne({ '_id': purchaseID } , function(err, purchase) {
				if(err) {
					console.log(err);
				} else {
					
					//validate purchase
					jsonAnswer = validate.doc(purchase, DOCTYPE, jsonAnswer);
					if(!jsonAnswer.purchase) {

						//validate refund's request's details
						jsonAnswer = validate.refund(refundReq, purchase, jsonAnswer);

					//if the purchase wasn't found logging and sending mail to the admin about it
					} else {
						console.log(FUNCTION + ' Error : ' + DOCTYPE + ' ' + purchaseID + ' cant be found in database');
						//mailer.sendMail(SENDER, ADMIN,'Notification from ' + FUNCTION, 'Error : ' + DOCTYPE + ' ' + purchaseID + ' cant be found in database');
					}

					//if validations failed
					if(Object.keys(jsonAnswer).length > 1) {
						jsonAnswer.status = "failed";
						console.log(jsonAnswer);

					//if validations was successful
					} else {
						
						//creating refund document using CreateRefund function
						purchase.refund = createRefund(refundReq, purchase);

						//"uploading" purchase to req
						req.purchase = purchase;

						//proceed to paypal/stripe RefundPayment
						if(purchase.paypal) {
							paypal.refundPayment(req, res);		
						}
						if(purchase.stripe) {
							stripe.refundPayment(req, res);
						}
					}
				}
			});
		}
	});
}

