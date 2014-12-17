var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var validate = require('./validate/index');
var mailer = require('./mailer');
var paypal = require('./paypal/index');
var stripe = require('./stripe/index');

/***********************
Executing Voids Requests
************************/
exports.execute = function(req, res) {

	//only for demenstration
	req.session.voidReq = { 
		"purchaseID" : "535079cf30f87e760e8ba177",
	}
	//permanent general veriables
	var FUNCTION = "Void::Execute";
	var DOCTYPE = "purchase";

	//json answer to Client
	var jsonAnswer = { "status": "success" }

	try {
		var voidReq = req.session.voidReq;
		var purchaseID = new ObjectID(voidReq.purchaseID);
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

						//validate void's request's details
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
						
						//"uploading" purchase to req
						req.purchase = purchase;

						//proceed to paypal/stripe VoidPayment
						if(purchase.paypal) {
							paypal.voidPayment(req, res);		
						}
						if(purchase.stripe) {
							stripe.voidPayment(req, res);
						}
					}
				}
			});
		}
	});
}

