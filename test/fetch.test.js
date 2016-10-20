var fetch = require('../fetch');

describe('fetch', function() {
    describe('#fetchPriceForAsin', function() {
        it('should call back without error for valid ASIN', function(done) {
            fetch.fetchPriceForAsin('B014V4DXMW', done);
        });
    });
});
