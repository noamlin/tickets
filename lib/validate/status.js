/******************************
Validate The Following Statuses
*******************************/
//Completed
exports.isCompleted = function(status) {
	if(status.toLowerCase() == "completed") {
		return true;
	}
	return false;
}
//Pending
exports.isPending = function(status) {
	if(status.toLowerCase() == "pending") {
		return true;
	}
	return false;
}
//Refunded
exports.isRefunded = function(status) {
	if(status.toLowerCase() == "refunded") {
		return true;
	}
	return false;
}
//Voided
exports.isVoided = function(status) {
	if(status.toLowerCase() == "voided") {
		return true;
	}
	return false;
}
//Reversed
exports.isReversed = function(status) {
	if(status.toLowerCase() == "reversed") {
		return true;
	}
	return false;
}
//Canceled Reversal
exports.isCompleted = function(status) {
	if(status.toLowerCase() == "canceled_reversal") {
		return true;
	}
	return false;
}
//Waiting For Capture
exports.isWFC = function(status) {
	if(status.toLowerCase() == "waiting_for_capture") {
		return true;
	}
	return false;
}
//Created
exports.isCreated = function(status) {
	if(status.toLowerCase() == "created") {
		return true;
	}
	return false;
}
//Processed
exports.isProcessed = function(status) {
	if(status.toLowerCase() == "processed") {
		return true;
	}
	return false;
}
