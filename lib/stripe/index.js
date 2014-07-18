var stripe = require("stripe")("sk_test_lY6YRQ7tBK2tefCc2Lt9vFNJ");
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
module.exports.webhook = require('./webhook');

//local function for handling stripe's errors
function errHandler (err) {
	switch (err.type) {
	case 'StripeCardError':
		//A declined card error
		console.log(err.message + ": Credit Card problems");
		break;
	case 'StripeInvalidRequest':
		//Invalid parameters were supplied to Stripe's API
		console.log(err.message + ": Invalid parameters were supplied to Stripe's API");
		break;
  case 'StripeAPIError':
		//An error occurred internally with Stripe's API
		console.log(err.message + ": An error occurred internally with Stripe's API");
		break;
	case 'StripeConnectionError':
		//Some kind of error occurred during the HTTPS communication
		console.log(err.message + ": Some kind of error occurred during the HTTPS communication");
		break;
	case 'StripeAuthenticationError':
		//You probably used an incorrect API key
		console.log(err.message + ": Probably an incorrect API key was used");
		break;
	default:
		//default message
		console.log(err.message);
	}
}

/*********************************************************
Create Stripe Payment(charge) Json & Execute Stripe Charge
**********************************************************/
exports.createPayment = function(req, res) {

	var purchase = req.purchase;

	var creditCard = {
		"number": "5555555555554444",
		"cvc": "312",
		"exp_month": "12",
		"exp_year": "2015"
	}

  var charge = {
		"amount": parseInt(purchase.amount.total*100),
		"currency": purchase.currency,
		"card": creditCard,
		"capture": true,
		"metadata": {
			"invoice": purchase._id,
			"quantity": purchase.quantity.total,
			"item_name": purchase.ticket.name,
			"ticket_final_price": parseInt(purchase.ticket.final_price*100)
		}
	}
	if(purchase.payment_type == "authorize") {
		charge.capture = false;
	} 

	stripe.charges.create(charge, function(err, charge) {
		if(err) {
			errHandler(err);
		} else {
			console.log(charge);
		}
	});
} 

/*function deleteAllCustomers() {

  stripe.customers.list(function(err, customers) {
    if(err) {
      errHandler(err);
    } else {
      for (var i = 0 ; i < customers.data.length ; i++) {
	stripe.customers.del(customers.data[i].id, function(err, confirmation) {
	  if(err) {
            errHandler(err);
          } else {
	    console.log(confirmation.deleted);
	  }
	});
      }
    }
  });
}

deleteAllCustomers();*/


	








