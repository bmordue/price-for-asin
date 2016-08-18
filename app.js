var fetch        = require('./fetch');
var finalhandler = require('finalhandler');
var http         = require('http');
var Router       = require('router');
var url          = require('url');
var util         = require('util');

const PORT = 3000;

function handleClientError(code, msg, req, res) {
	console.log(util.format("%s %s %s - BAD REQUEST: %s", code, req.method, req.url, msg));
	res.statusCode = code;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.end(JSON.stringify({error: msg}));
}

function handleBadRequest(errorMsg, req, res) {
	handleClientError(400, errorMsg, req, res);
}

function handleNotFound(req, res) {
	handleClientError(404, "Resource not found: " + req.url, req, res);
}

var router = Router();
router.get('/price', function (req, res) {

	if (req.method != "GET") {
		var errorMsg = "Method not accepted: " + req.method;
		return handleBadRequest(errorMsg, req, res);
	}
	var asin;
	try {
		asin = url.parse(req.url, true).query.asin;
	} catch (e) {
		return handleBadRequest("Bad query string", req, res);
	}
	if (!asin) {
		return handleBadRequest("No ASIN in query string", req, res);
	}
	fetch.fetchPriceForAsin(asin, function(err, result) {
		if (err) {
			console.log(err);
			return handleNotFound(req, res);
		}
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json; charset=utf-8');
		var responseJson = {
			price: result.price,
			currency: result.currency
		};
		var responseBody = JSON.stringify(responseJson, null, 4) + '\n';
		res.end(responseBody);
		console.log(util.format("%s %s %s", res.statusCode, req.method, req.url));
	});

});
 
var server = http.createServer(function(req, res) {
	router(req, res, finalhandler(req, res));
});
 
server.listen(PORT);
console.log("Server price-to-asin listening on port " + PORT);
