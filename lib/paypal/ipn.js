var ipn = require('paypal-ipn');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var mailer = require('../mailer');

//permanent mail-related veriables
var SENDER = "The Ticket <system@the-ticket.com>";
var ADMIN = "omerozery@gmail.com";

//local function for handaling paypal's status (sending mails and updating purchase document status accordinly)
function statusHandler(purchase) {

	//permanent veriables
	var FUNCTION = "Payal::IPN::StatusHandler"

	//permanent payment_status veriables
	var COMPLETED = 'Completed';
	var VOIDED = 'Voided';
	var EXPIRED = 'Expired';
	var REFUNDED = 'Refunded';
	var DENIED = 'Denied';
	var FAILED = 'Failed';
	var REVERSED = 'Reversed';
	var CANCELED_REVERSAL = 'Canceled_Reversal';
	var PROCESSED = 'Processed';
	var CREATED = 'Created';
	var PENDING = 'Pending';
	var WAITING_FOR_CAPTURE = 'Waiting_for_capture';
	var UNKNOWN = "Unknown";
	//permanent pending_reason veriables
	var AUTHORIZATION = 'authorization';
	var ADDRESS = 'address';
	var ECHECK = 'echeck';
	var INTL = 'intl';
	var MULTI_CURRENCY = 'multi-currency';
	var ORDER = 'order';
	var PAYMENTREVIEW = 'paymentreview';
	var REGULATORY_REVIEW = 'regulatory_review';
	var UPGRADE = 'upgrade';
	var UNILATERAL = 'unilateral';
	var VERIFY = 'verify';
	var OTHER = 'other';

	var paymentStatus = purchase.paypal.payment_status;
	purchase.status = paymentStatus;

	if (paymentStatus == PENDING) {
		var pendingReason = purchase.paypal.pending_reason;
		if(pendingReason == AUTHORIZATION) {
			purchase.status = WAITING_FOR_CAPTURE;
			//Notify the user by mail that his purchase is in pending state (only for pending reason - 'authorization')
			var body = "<b>Thank you for buying The-Tickets: your Ticket is waiting for approval, a new mail will be sent with the ticket/s details when transaction is done</b>";
			mailer.SendMail(SENDER, purchase.email, "The-Ticket ✔", body);
		} else {     
			switch (pendingReason) {
			case ADDRESS:
				var body = "<b>your customer did not include a confirmed shipping address and your Payment Receiving Preferences is set yo allow you to manually accept or deny each of these payments. To change your preference, go to the Preferences section of your Profile.<b>";
				break;

			case ECHECK:
				var body = "<b>The payment was made by an eCheck that has not yet cleared.<b>";
				break;

			case INTL:
				var body = "<b>you hold a non-U.S. account and do not have a withdrawal mechanism. You must manually accept or deny this payment from your Account Overview.<b>";
				break;

			case MULTI_CURRENCY:
				var body = "<b>You do not have a balance in the currency sent, and you do not have your profiles's Payment Receiving Preferences option set to automatically convert and accept this payment. As a result, you must manually accept or deny this payment.<b>";
				break;

			case ORDER:
				var body = "<b>You set the payment action to Order and have not yet captured funds.<b>";
				break;

      case PAYMENTREVIEW:
				var body = "<b>The payment is being reviewed by PayPal for risk.<b>";
				break;

      case REGULATORY_REVIEW:
				var body = "<b>The payment is pending because PayPal is reviewing it for compliance with government regulations. PayPal will complete this review within 72 hours. When the review is complete, you will receive a second IPN message whose payment_status/reason code variables indicate the result.<b>";
				break;

			case UPGRADE:
				var body = "<b>The payment was made to an email address that is not yet registered or confirmed.<b>";
				break;

			case UNILATERAL:
				var body = "<b>The payment was made via credit card and you must upgrade your account to Business or Premier status before you can receive the funds. upgrade can also mean that you have reached the monthly limit for transactions on your account.<b>";
				break;

			case VERIFY:
				var body = "<b>you are not yet verified. You must verify your account before you can accept this payment.<b>";
				break;

			case OTHER:
				var body = "<b>The payment is pending for a reason other than those listed above. For more information, contact PayPal Customer Service.<b>"     
				break;

			default:
				console.log(FUNCTION + " Error : purchase: " + purchase._id + " is pending with unfamiliar pending reason: " + pendingReason);
				var body = "Error : purchase: " + purchase._id + " is pending with unfamiliar pending reason: " + pendingReason;
			}
			//Notify the admin by mail about any of the pending reasons (other then 'authorization');
			mailer.SendMail(SENDER, ADMIN, 'Notification from ' + FUNCTION, body);
		}
	} else {
		switch(paymentStatus) {
		case COMPLETED:
		var body = "<b>Thank you for buying " + purchase.paypal.quantity1 + " Tickets of: " + purchase.paypal.item_name1 +
			" in total cost of " + purchase.paypal.mc_gross + " " + purchase.paypal.mc_currency + "</b>"; 
			break;

		case VOIDED:
			var body = "<b>We dont want to sell you any ticket<b>";
			break;

		case EXPIRED:
			var body = "<b>The event's admin was delaying for too long your purchase's approval so no charge has been made<b>";
			break;

		case REFUNDED:
			var body = "<b>Charge was Refunded<b>";
			break;

		case DENIED:
			var body = "<b>The payment was denied. This happens only if the payment was previously pending because of one of the reasons listed for the pending_reason variable or the Fraud_Management_Filters_x variable.<b>";
			break;

		case FAILED:
			var body = "<b>Charge failed : The payment has failed. This happens only if the payment was made from your bank account<b>";
			break;

		case REVERSED:
			var body = "<b>The payment was reversed due to a chargeback or other type of reversal. The funds have been returned to you<b>";
			break;

		case CANCELED_REVERSAL:
			var body = "<b>Successfully canceled The Payment reversal, the funds for the transaction that was reversed have been returned to the seller.<b>";
			break;

    case PROCESSED:
			var body = "<b>The payment has been accepted<b>";
			break;

		case CREATED:
			var body = "<b>A German ELV payment is made using Express Checkout.<b>";
			break;

    default:
      purchase.status = UNKNOWN;
      console.log(FUNCTION + " Error : purchase: " + purchase._id + " entered to Unknown payment status due to an unfamiliar paypal payment status:: " + paymentStatus);
      var body = "Error : purchase: " + purchase._id + " entered to Unknown payment status due to an unfamiliar paypal payment status: " + paymentStatus;
      //Notify the admin by mail about an Unknown payment_status arrived from paypal's IPN
      mailer.SendMail(SENDER, ADMIN, 'Notification from ' + FUNCTION, body);
      body = "<b>An Error occurred while processing your purchase request, we are taking care of it as quickly as possible, thank you for buying The-Tickets and sorry for the delay<b>";
		}
    //Notify the user by mail about his payment status;
    mailer.SendMail(SENDER, purchase.email, "The-Ticket ✔", body);
	}
	return purchase;
};

/***************************************************
Handling IPN's (Paypal Instant Payment Notification)
****************************************************/
exports.handle = function(req, res) {

	//permanent veriables
	var FUNCTION = "Payal::IPN::Handle";

	//Send HTTP 200 to paypal as required
	res.send(200);
	//Verify IPN against paypal servers
	ipn.verify(req.body, function callback(err, msg) {
		if(err) {
			console.error(msg);
		} else {
			var MongoClient = mongodb.MongoClient;
			MongoClient.connect("mongodb://localhost:27017/tickets", function(err, db) {
				if(err) {
					console.log(err);
				} else { 
					console.log(FUNCTION + ' : A connection to the database has been made using mongoClient');
					try {
						var purchaseID = new ObjectID(req.param('invoice'));
					} catch (err) {
						console.log(err)
					}
					db.collection('purchases').findOne({ '_id': purchaseID }, function(err, purchase) {
						if(err) {
							console.log(err);
						} else {
							if(!purchase) {
								//logging and sending mail to the admin about it
								console.log(FUNCTION + ' Error : purchase ' + purchaseID + ' cant be found');
								mailer.sendMail(SENDER, ADMIN, 'Notification from ' + FUNCTION, "IPN: " +
					    	JSON.stringify(req.body, null, 2) + " has arrived with invoice: " + purchaseID + " and does not match any purchase id in database");
							} else {
								if(!purchase.paypal) {
										purchase.paypal = {}
								}
								if(req.param('txn_type') == 'new_case') {
									//Building the purchase's paypal's dispute subdocument
									purchase.paypal.dispute = {
										"case_creation_date": req.param("case_creation_date"),
										"case_id": req.param("case_id"),
										"case_type": req.param('case_type'),
										"reason_code": req.param("reason_code"),
									}
								} else {
									//Extracting the dispute subdocument if exists
									var dispute;
									if(purchase.paypal.dispute) {
										dispute = purchase.paypal.dispute;
									}
									//Building the purchase's paypal subdocument
									purchase.paypal = { 
										"first_name" : req.param('first_name'),
										"last_name" : req.param('last_name'),
										"payer_email" : req.param('payer_email'),
										"mc_currency" : req.param('mc_currency'),
										"txn_id" : req.param('txn_id'),
										"payment_date" : req.param('payment_date'),
										"payment_status" : req.param('payment_status'),
										"mc_gross" : parseFloat(req.param('mc_gross')),
										"quantity1" : parseInt(req.param('quantity1')),
										"item_name1" : req.param('item_name1')
									}
									//adding pending reason if exists (exists if payment_status = 'Pending' according to paypal)
									if(req.param('pending_reason')) {
										purchase.paypal.pending_reason = req.param('pending_reason');
									}
									//adding reason_code if exists (exists if payment_status = 'Reversed' or 'Refunded' or 'Canceled_Reversal' or 'Denied' according to paypal)
									if(req.param('reason_code')) {
										purchase.paypal.reason_code = req.param('reason_code');
									}
									//adding back the dispute subdocument if existed
									if(dispute) {
										purchase.paypal.dispute = dispute;
									}
									//Updating purchase status and sending mails accordinly
									purchase = statusHandler(purchase);
								}
								//Updating purchase document in databse 
								db.collection('purchases').update({ '_id': purchaseID } , purchase , function(err, records) {
									if(err) {
										console.log(err);
									} else {
				 	    			console.log(FUNCTION + " : Paypal record for purchase: " + purchaseID + " has been updated");
					  			}
								});
							}
						}
					});
				}
			});
		}
  });
}

