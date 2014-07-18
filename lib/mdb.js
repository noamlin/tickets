var mongodb = require('mongodb');

exports.connect = function(req, res) {

	//permanent veriables
	var FUNCTION = "MDB::Connect";

	var MongoClient = mongodb.MongoClient;
	MongoClient.connect("mongodb://localhost:27017/tickets", function(err, db) {
		if(err) {
			console.log(err);
		} else {
			console.log(FUNCTION + ' : A connection to the database has been made using mongoClient');
		}
	});
}

exports.findOne = function(findOne, db) {

	//permanent veriables
	var FUNCTION = "MDB::FindOne";
	db.collection(findOne.collection).findOne(findOne.query , function(err, event) {
		if(err) {
			console.log(err);
		} else {
		}
	});
}	

exports.insert = function(req, res) {

	//permanent veriables
	var FUNCTION = "MDB::Insert";

	var collection = req.collection;
	req.db.collection(req.collection).insert(req.insert , function(err, records) {
		if(err) {
			console.log(err);
		} else {
			console.log(FUNCTION + " : new doc " + records[0]._id + " was added to " + collection + "'s collection");
		}
	});
}

exports.update = function(req, res) {

	//permanent veriables
	var FUNCTION = "MDB::Update";
	
	var collection = req.collection;
	req.db.collection(req.collection).update(req.query , req.update , function(err, records) {
		if(err) {
			console.log(err);
		} else {
			console.log(FUNCTION + " : " + collection + " collection was updated");
		}
	});
}



