const assert = require('assert');
const { isValidAsin } = require('../lib/validation');

describe('ASIN validation', function() {
    it('should accept a valid 10-character uppercase ASIN', function() {
        assert.ok(isValidAsin('B014V4DXMW'));
    });

    it('should accept a valid numeric-only ASIN', function() {
        assert.ok(isValidAsin('0123456789'));
    });

    it('should reject an ASIN that is too short', function() {
        assert.ok(!isValidAsin('B014V4DXM'));
    });

    it('should reject an ASIN that is too long', function() {
        assert.ok(!isValidAsin('B014V4DXMWX'));
    });

    it('should reject an ASIN with lowercase letters', function() {
        assert.ok(!isValidAsin('b014v4dxmw'));
    });

    it('should reject an ASIN with special characters', function() {
        assert.ok(!isValidAsin('B014V4DX!!'));
    });

    it('should reject an empty string', function() {
        assert.ok(!isValidAsin(''));
    });

    it('should reject a non-string value', function() {
        assert.ok(!isValidAsin(null));
        assert.ok(!isValidAsin(undefined));
    });
});

describe('URL parsing', function() {
    it('should correctly parse ASIN from query string using URL API', function() {
        const parsedUrl = new URL('/price?asin=B014V4DXMW', 'http://localhost');
        assert.strictEqual(parsedUrl.searchParams.get('asin'), 'B014V4DXMW');
    });

    it('should return null when ASIN parameter is missing', function() {
        const parsedUrl = new URL('/price', 'http://localhost');
        assert.strictEqual(parsedUrl.searchParams.get('asin'), null);
    });

    it('should return the first value when ASIN appears multiple times', function() {
        const parsedUrl = new URL('/price?asin=B014V4DXMW&asin=OTHER', 'http://localhost');
        assert.strictEqual(parsedUrl.searchParams.get('asin'), 'B014V4DXMW');
    });
});
