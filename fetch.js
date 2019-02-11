var fs = require('fs');
var htmlparser = require('htmlparser');
var log = require('./log');
var needle = require('needle');
var path = require('path');
var StatsD = require('node-statsd');
var util = require('util');

var statsd = new StatsD({prefix: 'price-for-asin.fetch.'});

function constructUrl(asin) {
	return "http://www.amazon.co.uk/gp/aw/s/ref=is_box_?k=" + asin; // mobile site
}

function dumpHtml(html, error, callback) {
	statsd.increment('html_dumped');
	var filename = path.join('out', (new Date()).toISOString() + '_dump.html');
	fs.writeFile(filename, html, function(err) {
		log.info({filename: filename}, 'Write HTML dump file');
		if (err) {
			log.error({filename: filename, err: err}, 'Error writing HTML dump file');
		}
		callback(error);
	});
}

function parsePage(html, callback) {
	statsd.increment('pages_parsed');
	var handler = new htmlparser.DefaultHandler(function (error, dom) {
		if (error) {
			return dumpHtml(html, error, callback);
		}
		if (!dom) {
			return dumpHtml(html, new Error("No DOM object!"), callback);
		}
		var price;
		try {
			var bolds = htmlparser.DomUtils.getElementsByTagName("b", dom);
			price = bolds[2].children[0].data;
		} catch (e) {
			return dumpHtml(html, e, callback);
		}
		if (price[0] != '£') {
			return dumpHtml(html, new Error("Expected currency symbol to be £; got " + price[0]), callback);
		}
		price = parseFloat(price.slice(1));
		if (isNaN(price)) {
			var errMsg = "Failed to convert price string to float; result is NaN";
			log.error({price: price}, errMsg);
			callback(new Error(errMsg));
		}
		var result = {
			price: price,
			currency: "GBP"
		};
		callback(null, result);
	});
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
}

function fetchPriceForAsin(asin, callback){
	statsd.increment('requests_made');
	log.info({asin: asin}, "fetchPriceForAsin");
	var options = { follow_max: 5 };
	needle.get(constructUrl(asin), options, function(err, response) {
		if (err) {
			return callback(err);
		}
		if (response.statusCode != 200) {
			log.error({status_code: response.statusCode }, util.format("ERROR: status code %s", response.statusCode));
			log.debug({body: response.body, headers: response.headers}, "Response for unsuccessful request");
			return callback(new Error("Expected status code 200; got " + response.statusCode));
		}
		parsePage(response.body, callback);
	});
}

module.exports = {
	fetchPriceForAsin: fetchPriceForAsin
};
