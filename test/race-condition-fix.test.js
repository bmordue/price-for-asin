const fetch = require('../fetch');
const assert = require('assert');

describe('race condition fix', function() {
    this.timeout(10000);
    
    it('should not have race condition where isProcessing is set false before callback completes', function(done) {
        // Mock needle to simulate slow response processing
        const needle = require('needle');
        const originalGet = needle.get;
        
        let callbackCallCount = 0;
        let processingStateWhenCallbackCalled = [];
        
        // Mock the internal rate limiting variables to observe them
        const fetchModule = require('../fetch');
        
        needle.get = function(url, options, callback) {
            // Simulate a response that takes some time to process
            setTimeout(() => {
                callback(null, {
                    statusCode: 200,
                    body: '<html><b>Test</b><b>Test</b><b>£10.99</b></html>'
                });
            }, 100); // 100ms delay to simulate processing time
        };
        
        function testCallback(err, result) {
            callbackCallCount++;
            
            // Record the state when this callback is invoked
            // In a race condition, isProcessing would be false even though 
            // the callback hasn't completed yet
            processingStateWhenCallbackCalled.push(Date.now());
            
            if (callbackCallCount === 2) {
                // Restore original needle.get
                needle.get = originalGet;
                
                // Verify both callbacks were called
                assert.strictEqual(callbackCallCount, 2, 'Both callbacks should be called');
                
                // Check that there was proper spacing between callback completions
                const timeDiff = processingStateWhenCallbackCalled[1] - processingStateWhenCallbackCalled[0];
                assert(timeDiff >= 1000, `Second request callback should be called at least 1000ms after first, was ${timeDiff}ms`);
                
                done();
            }
        }
        
        // Make two rapid requests - this would trigger the race condition in the unfixed version
        fetch.fetchPriceForAsin('TEST1', testCallback);
        fetch.fetchPriceForAsin('TEST2', testCallback);
    });
    
    it('should complete each request fully before starting the next one', function(done) {
        const needle = require('needle');
        const originalGet = needle.get;
        
        let activeRequestCount = 0;
        let maxConcurrentRequests = 0;
        let requestStartTimes = [];
        let requestEndTimes = [];
        
        needle.get = function(url, options, callback) {
            activeRequestCount++;
            maxConcurrentRequests = Math.max(maxConcurrentRequests, activeRequestCount);
            requestStartTimes.push(Date.now());
            
            // Simulate request processing time
            setTimeout(() => {
                requestEndTimes.push(Date.now());
                activeRequestCount--;
                callback(null, {
                    statusCode: 200,
                    body: '<html><b>Test</b><b>Test</b><b>£5.99</b></html>'
                });
            }, 50);
        };
        
        let completedCallbacks = 0;
        function onComplete() {
            completedCallbacks++;
            if (completedCallbacks === 3) {
                // Restore original needle.get
                needle.get = originalGet;
                
                // Verify that no more than 1 request was active at any time
                assert.strictEqual(maxConcurrentRequests, 1, 'Should never have more than 1 concurrent request');
                
                // Verify requests were properly spaced (each should start after the previous completes)
                assert.strictEqual(requestStartTimes.length, 3, 'Should have 3 request start times');
                assert.strictEqual(requestEndTimes.length, 3, 'Should have 3 request end times');
                
                // Verify timing: each request should start at least 1 second after the previous
                for (let i = 1; i < requestStartTimes.length; i++) {
                    const timeDiff = requestStartTimes[i] - requestStartTimes[i-1];
                    assert(timeDiff >= 1000, `Request ${i+1} should start at least 1000ms after request ${i}, was ${timeDiff}ms`);
                }
                
                done();
            }
        }
        
        // Make three rapid requests
        fetch.fetchPriceForAsin('TEST1', onComplete);
        fetch.fetchPriceForAsin('TEST2', onComplete);
        fetch.fetchPriceForAsin('TEST3', onComplete);
    });
});