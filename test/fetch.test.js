const fetch = require('../fetch');
const assert = require('assert');
const util = require('util');

describe('fetch', function() {
    describe('#fetchPriceForAsin', function() {
        it('should call back without error for valid ASIN', function(done) {
            fetch.fetchPriceForAsin('B014V4DXMW', done);
        });

        it('should call back with a price and currency for valid ASIN', function(done) {
            fetch.fetchPriceForAsin('B014V4DXMW', function(err, result) {
		if (err) { return done(err); }
		assert.strictEqual(typeof result.price, 'number');
		assert.strictEqual(result.currency, 'GBP');
                done();
	    });
        });
    });

});
