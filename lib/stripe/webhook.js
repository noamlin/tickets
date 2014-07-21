var stripe = require("stripe")("sk_test_lY6YRQ7tBK2tefCc2Lt9vFNJ");
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var mailer = require('../mailer');

//permanent veriables
var SENDER = "The Ticket <system@the-ticket.com>";
var ADMIN = "omerozery@gmail.com";

//local function for handaling stripe's status (sending mails and updating purchase document status accordinly)
function statusHandler(purchase) {

	var paymentStatus = purchase.stripe.type;
	var captured = purchase.stripe.captured;
	if(captured) {
		if(paymentStatus == 'charge.succeeded' || paymentStatus == 'charge.captured') {
			purchase.status = 'Completed';
			var body = "<b>Thank you for buying " + purchase.stripe.quantity + " Tickets of: " + purchase.stripe.item_name +
			" in total cost of " + (purchase.stripe.amount/100) + " " + purchase.stripe.currency + "</b>";
		}
		if(paymentStatus == 'charge.refunded') {
			purchase.status = 'Refunded';
			var body = "<b>You got refunded in amount of: " + purchase.stripe.amount_refunded + " " + purchase.stripe.currency + "<b>";
		}
		if(paymentStatus == 'charge.failed') {
			purchase.status = 'Failed';
			var body = "<b>Charge Failed<b>";
		}
	} else {
		purchase.status = 'Waiting for capture';
		//Notify the user by mail that his purchase yet to be captured
		var body = "<b>Thank you for buying The-Tickets: your Ticket is waiting for approval, a new mail will be sent with the ticket/s details when transaction is done</b>";
	}

	//Notify the admin by mail about an Unknown payment_status arrived from paypal's IPN
  mailer.SendMail(SENDER, purchase.email, "The-Ticket ✔", body);
	return purchase;
}

/**********************************
Handling Notifications from  Stripe 
***********************************/
exports.handle = function(req, res) {

	//permanent veriables
	var FUNCTION = "Stripe::WebHook::Handle";

  var event = req.body;
  if(event.type == "charge.succeeded" || event.type == "charge.failed" || event.type == "charge.refunded" || event.type == "charge.captured"){
		var charge = event.data.object
		try {
			var purchaseID = new ObjectID(charge.metadata.invoice);
		} catch (err) {
			console.log(err)
		}
		var MongoClient = mongodb.MongoClient;
		MongoClient.connect("mongodb://localhost:27017/tickets", function(err, db) {
			if(err) {
				console.log(err);
			} else { 
				console.log(FUNCTION + ' : A connection to the database has been made using mongoClient');
				db.collection('purchases').findOne({ '_id': purchaseID }, function(err, purchase) {
					if(err) {
						console.log(err);
					} else {
						if(!purchase) {
	    				//logging and sending mail to the admin about it
	    				console.log(FUNCTION + ' Error : purchase ' + purchaseID + ' cant be found');
	    				mailer.sendMail(SENDER, ADMIN, "Notification from " + FUNCTION, "CHARGE: " +
            	JSON.stringify(req.body, null, 2) + " has arrived with invoice: " + purchaseID + " and does not much any purchase id in database");
	    			} else {
							//Building the purchase's Stripe subdocument
							purchase.stripe = {
								"id": charge.id,
								"type": event.type,
								"currency": charge.currency,
								"amount": parseInt(charge.amount),
								"captured": Boolean(charge.captured),						
								"amount_refunded" : parseInt(charge.amount_refunded),
								"quantity": parseInt(charge.metadata.quantity),
								"item_name": charge.metadata.item_name
							}
							//Updating purchase status and sending mails accordinly
							purchase = statusHandler(purchase);
							db.collection('purchases').update({ '_id': purchaseID } , purchase , function(err, records) {
	  						if(err) {
	    						console.log(err);
      	  			} else {
       	    			console.log(FUNCTION + " : Stripe record for purchase: " + purchaseID + " has been updated");
          			}
							});
						}
					}
				});
			}
		});
	}
}

