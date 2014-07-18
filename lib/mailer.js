var nodemailer = require("nodemailer");

/************************ 
Sending Mail through SMTP
*************************/
exports.sendMail = function (sender, recipient, title, body) {

	//create reusable transport method (opens pool of SMTP connections)
	var smtpTransport = nodemailer.createTransport("SMTP",{
		service: "Gmail",
		auth: {
			user: "omerozery@gmail.com",
			pass: "Om410198"
		}
	});

	//composing the mail's sender, recipient and subject
	var mailOptions = {
		from: sender,
		to: recipient,
		subject: title,
		html: body
	};

	//send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(err, response) {
		if(err){
			console.log(err);
		} else {
			console.log("Message sent: " + response.message);
		}
		//shut down the connection pool, no more messages
		smtpTransport.close();
	});
}
