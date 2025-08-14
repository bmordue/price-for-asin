const fetch = require('../fetch');
const assert = require('assert');

describe('rate limiting', function() {
    this.timeout(5000); // Give enough time for rate limiting tests
    
    it('should enforce rate limiting between requests', function(done) {
        // Mock needle to avoid actual HTTP requests
        const needle = require('needle');
        const originalGet = needle.get;
        
        let requestTimes = [];
        needle.get = function(url, options, callback) {
            requestTimes.push(Date.now());
            // Simulate a successful response
            setImmediate(() => {
                callback(null, {
                    statusCode: 200,
                    body: '<html><b>Test</b><b>Test</b><b>£10.99</b></html>'
                });
            });
        };
        
        // Make 3 rapid requests
        let completedRequests = 0;
        const expectedRequests = 3;
        
        function onComplete() {
            completedRequests++;
            if (completedRequests === expectedRequests) {
                // Restore original needle.get
                needle.get = originalGet;
                
                // Check timing between requests
                assert.strictEqual(requestTimes.length, 3, 'Should have made 3 requests');
                
                // First request should be immediate, subsequent ones should be rate limited
                if (requestTimes.length >= 2) {
                    const timeDiff1 = requestTimes[1] - requestTimes[0];
                    assert(timeDiff1 >= 1000, `Second request should be delayed by ~1000ms, was ${timeDiff1}ms`);
                }
                
                if (requestTimes.length >= 3) {
                    const timeDiff2 = requestTimes[2] - requestTimes[1];
                    assert(timeDiff2 >= 1000, `Third request should be delayed by ~1000ms, was ${timeDiff2}ms`);
                }
                
                done();
            }
        }
        
        // Make requests rapidly
        fetch.fetchPriceForAsin('TEST1', onComplete);
        fetch.fetchPriceForAsin('TEST2', onComplete);  
        fetch.fetchPriceForAsin('TEST3', onComplete);
    });
});