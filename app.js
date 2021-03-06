/*Setup*/
var express = require('express');

// var databaseUrl = "restbugs"; // local instance
var databaseUrl = "mongodb://" + process.env.MONGOUSER + ":" + process.env.MONGOPASSWORD + "@ds037657.mongolab.com:37657/restbugs";
var collections = ["bugs"];
var mongo = require('mongojs');
var db = mongo.connect(databaseUrl, collections);

var port;
if (process.argv[2])
	port = parseInt(process.argv[2]);
else {
	port = process.env.PORT || 5000
}

var app = express();
app.listen(port);

var webPort = "9200";
var webHost = "restbugs.herokuapp.com"

app.configure(function(){
	app.set('view engine', 'ejs');
	app.set('view options', {
		layout: false
	});
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});

/*Helper functions*/

function addToHistory(doc, comments, stateChanges){
	if(doc.history === undefined)
		doc.history = [];

	doc.history.push({
		addedOn: new Date(),
		comments: comments,
		changes: stateChanges
	});
};

function updateStatus(doc, status, comments){
	doc.status = status;
	addToHistory(doc, comments, {status : doc.status});
};

function activate(doc, comments){
	updateStatus(doc, 'Working', comments);
};

function resolve(doc, comments){
	updateStatus(doc, 'QA', comments);
};

function close(doc, comments){
	updateStatus(doc, 'Done', comments);
};

function toBacklog(doc, comments){
	updateStatus(doc, 'Backlog', comments);
};

function newbug(title, description){
	var bug = {
		title: title,
		description: description
	};
	toBacklog(bug, "bug created");
	return bug;
};

/*API Surface*/

app.get('/', function(req, res){
	console.log();
	res.render('bugs-all.ejs', {
		title: "Index",
		renderWeb: isHuman(req.headers.host)
	});
});

app.get('/backlog', function(req, res){

	db.bugs.find({status: 'Backlog'}, function(err, docs) {
		res.render('bugs-all.ejs', {
			title: "Backlog",
			model: docs,
			renderWeb: isHuman(req.headers.host)
		});
	});
});

var isHuman = function(host){
	//console.log(host);
	return host && (host.indexOf(webPort) !== -1 || host.indexOf(webHost) !== -1)
};

var setResponse = function(req, res, redirectUrl, statusCode, body){

	if (isHuman(req.headers.host)) {
		res.redirect(redirectUrl);
	}
	else {
		var statusCode = statusCode;
		res.statusCode = statusCode;
		res.render("response.ejs", {
			statusCode: statusCode,
			body: body
		});
	}
};

app.post('/backlog', function(req, res){

	//todo: consider replacing with upsert-style call
	if(req.body.id===undefined) {

		db.bugs.save(
			newbug(req.body.title, req.body.description),
			function(err, savedDoc) {
				db.bugs.find( {status: 'Backlog'}, function(err, docs) {
					setResponse(req, res, "/backlog", 201, "Created bug");
				});
		});
	} else {

		db.bugs.findOne( {_id: mongo.ObjectId(req.body.id) }, function(err, doc) {
			//todo: return 404 if doc is undefined

			toBacklog(doc, req.body.comments);

			db.bugs.update( {_id: mongo.ObjectId(req.body.id) }, doc, function(err, updatedDoc){
				db.bugs.find({status:'Backlog'}, function(err, docs){
					setResponse(req, res, "/backlog", 201, "Moved bug to backlog");
				});
			});
		});
	}
});

app.get('/working', function(req, res){
	db.bugs.find({status:'Working'}, function(err, docs){
		res.render('bugs-all.ejs', {
			title: "Working",
			model: docs,
			renderWeb: isHuman(req.headers.host)
		});
	});
});

app.post('/working', function(req, res){
	db.bugs.findOne( {_id: mongo.ObjectId(req.body.id) }, function(err, doc) {
		//todo: return 404 if doc is undefined

		activate(doc, req.body.comments);

		db.bugs.update( {_id: mongo.ObjectId(req.body.id) }, doc, function(err, updatedDoc){
			db.bugs.find({status:'Working'}, function(err, docs){
				setResponse(req, res, "/working", 201, "Moved bug to working");
			});
		});
	});
});

app.get('/qa', function(req, res){
	db.bugs.find({status:'QA'}, function(err, docs){
		res.render('bugs-all.ejs', {
			title: "QA",
			model: docs,
			renderWeb: isHuman(req.headers.host)
		});
	});
});

app.post('/qa', function(req, res){
	db.bugs.findOne( {_id: mongo.ObjectId(req.body.id) }, function(err, doc) {
		//todo: return 404 if doc is undefined

		resolve(doc, req.body.comments);

		db.bugs.update( {_id: mongo.ObjectId(req.body.id) }, doc, function(err, updatedDoc){
			db.bugs.find({status:'QA'}, function(err, docs){
				setResponse(req, res, "/qa", 201, "Moved bug to QA");
			});
		});
	});
});

app.get('/done', function(req, res){
	db.bugs.find({status:'Done'}, function(err, docs){
		res.render('bugs-all.ejs', {
			title: "Done",
			model: docs,
			renderWeb: isHuman(req.headers.host)
		});
	});
});

app.post('/done', function(req, res){
	db.bugs.findOne( {_id: mongo.ObjectId(req.body.id) }, function(err, doc) {
		//todo: return 404 if doc is undefined

		close(doc, req.body.comments);

		db.bugs.update( {_id: mongo.ObjectId(req.body.id) }, doc, function(err, updatedDoc){
			db.bugs.find({status:'Done'}, function(err, docs){
				setResponse(req, res, "http://localhost:9200/done", 201, "Moved bug to done");
			});
		});
	});
});

/*first, let's remove any initial values in the database*/
//db.bugs.remove({});
