const fetch = require('../fetch');
const assert = require('assert');

describe('comprehensive race condition fix validation', function() {
    this.timeout(15000);
    
    it('should handle the exact scenario described in the issue', function(done) {
        const needle = require('needle');
        const originalGet = needle.get;
        
        let concurrentRequestCount = 0;
        let maxConcurrentRequests = 0;
        let requestProcessingTimes = [];
        
        needle.get = function(url, options, callback) {
            concurrentRequestCount++;
            maxConcurrentRequests = Math.max(maxConcurrentRequests, concurrentRequestCount);
            
            const startTime = Date.now();
            
            // Simulate varying response processing times
            const processingTime = 50 + Math.random() * 100; // 50-150ms
            
            setTimeout(() => {
                const endTime = Date.now();
                requestProcessingTimes.push({
                    start: startTime,
                    end: endTime,
                    duration: endTime - startTime,
                    url: url
                });
                
                concurrentRequestCount--;
                
                callback(null, {
                    statusCode: 200,
                    body: '<html><b>Test</b><b>Test</b><b>£' + (Math.random() * 100).toFixed(2) + '</b></html>'
                });
            }, processingTime);
        };
        
        let completedCallbacks = 0;
        const totalRequests = 5;
        const callbackTimes = [];
        
        function requestCallback(err, result) {
            callbackTimes.push(Date.now());
            completedCallbacks++;
            
            if (completedCallbacks === totalRequests) {
                // Restore original needle.get
                needle.get = originalGet;
                
                // Validate no race conditions occurred
                assert.strictEqual(maxConcurrentRequests, 1, 
                    'Race condition detected: more than 1 request was processing concurrently');
                
                // Validate proper spacing between requests
                for (let i = 1; i < requestProcessingTimes.length; i++) {
                    const timeBetweenStarts = requestProcessingTimes[i].start - requestProcessingTimes[i-1].start;
                    assert(timeBetweenStarts >= 1000, 
                        `Race condition: Request ${i+1} started only ${timeBetweenStarts}ms after request ${i}`);
                }
                
                // Validate that callback completions are also properly spaced
                for (let i = 1; i < callbackTimes.length; i++) {
                    const timeBetweenCallbacks = callbackTimes[i] - callbackTimes[i-1];
                    assert(timeBetweenCallbacks >= 900, // Allow some tolerance for processing time
                        `Callbacks completed too close together: ${timeBetweenCallbacks}ms between callback ${i} and ${i+1}`);
                }
                
                console.log('✅ Race condition fix validated successfully:');
                console.log(`   - Maximum concurrent requests: ${maxConcurrentRequests}`);
                console.log(`   - All ${totalRequests} requests completed`);
                console.log('   - Proper 1-second spacing maintained');
                
                done();
            }
        }
        
        // Rapidly submit multiple requests - this would have triggered the race condition
        console.log('Submitting 5 rapid requests to test race condition fix...');
        for (let i = 0; i < totalRequests; i++) {
            fetch.fetchPriceForAsin(`TEST_PRODUCT_${i}`, requestCallback);
        }
    });
});