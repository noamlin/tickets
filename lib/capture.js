var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var validate = require('./validate/index');
var mailer = require('./mailer');
var paypal = require('./paypal/index');
var stripe = require('./stripe/index');

/*************************
Executing Capture Requests
**************************/
exports.execute = function(req, res) {

	//only for demenstration
	req.session.captureReq = { 
		"purchaseID" : "535079cf30f87e760e8ba177",
	}
	//permanent general veriables
	var FUNCTION = "Capture::Execute";
	var DOCTYPE = "purchase";
 
	//json answer to Client
	var jsonAnswer = { "status": "success" }

	try {
		var captureReq = req.session.captureReq;
		var purchaseID = new ObjectID(captureReq.purchaseID);
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

						//validate capture's request's details
						//jsonAnswer = validate.authorize(purchase, jsonAnswer);

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

						//"uploading" capture to req
						req.purchase = purchase;

						//proceed to paypal/stripe CapturePayment
						if(purchase.paypal) {
							paypal.capturePayment(req, res);		
						}
						if(purchase.stripe) {
							stripe.capturePayment(req, res);
						}
					}
				}
			});
		}
	});
}

