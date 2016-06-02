var fs = require('fs');
var needle = require('needle');
var htmlparser = require('htmlparser');
var util = require('util');

function constructUrl(asin) {
	return "http://www.amazon.co.uk/gp/aw/s/ref=is_box_?k=" + asin; // mobile site
}

function dumpHtml(html, error, callback) {
	var filename = (new Date()).toISOString() + '_dump.html';
	fs.writeFile(filename, html, function(err) {
		if (err) {
			console.log('Error writing file ' + filename + '\n' + util.inspect(err));
		}
		callback(error);
	});
}

function parsePage(html, callback) {
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
		price = price.slice(1);
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
	var options = { follow_max: 5 };
	needle.get(constructUrl(asin), options, function(err, response) {
		if (err) {
			return callback(err);
		}
		if (response.statusCode != 200) {
			console.log(util.format('ERROR: status code %s', response.statusCode));
			console.log(util.format('DEBUG: %j', response.body));
			return callback(new Error("Expected status code 200; got " + response.statusCode));
		}
		parsePage(response.body, callback);		
	});
}

module.exports = {
	fetchPriceForAsin: fetchPriceForAsin
};
