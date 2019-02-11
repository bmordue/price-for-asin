var fetch        = require('./fetch');
var finalhandler = require('finalhandler');
var http         = require('http');
var log          = require('./log');
var Router       = require('router');
var StatsD       = require('node-statsd');
var url          = require('url');
var util         = require('util');

var statsd = new StatsD({prefix: 'price-for-asin.api.'});

const PORT = 3000;

function handleClientError(code, msg, req, res) {
	statsd.increment('error_responses');
	log.info({status_code: code, method: req.method, url: req.url}, util.format("BAD REQUEST: %s", msg));
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
	statsd.increment('requests');

	if (req.method != "GET") {
		var errorMsg = "Method not accepted: " + req.method;
		return handleBadRequest(errorMsg, req, res);
	}
	var asin;
	try {
		asin = url.parse(req.url, true).query.asin;
		log.info({asin: asin}, "ASIN in query string: ");
	} catch (e) {
		return handleBadRequest("Bad query string", req, res);
	}
	if (!asin) {
		return handleBadRequest("No ASIN in query string", req, res);
	} else {
	fetch.fetchPriceForAsin(asin, function(err, result) {
		if (err) {
			log.error(err, "fetchPriceForAsin returned err");
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
		log.info({status_code: res.statusCode, method: req.method, url: req.url}, "Successful request");
	});
	}

});
 
var server = http.createServer(function(req, res) {
	router(req, res, finalhandler(req, res));
});
 
server.listen(PORT);
log.info({}, "Server price-to-asin listening on port " + PORT);
