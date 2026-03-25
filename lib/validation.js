// ASIN format: 10 uppercase alphanumeric characters
const ASIN_PATTERN = /^[A-Z0-9]{10}$/;

function isValidAsin(asin) {
	return typeof asin === 'string' && ASIN_PATTERN.test(asin);
}

module.exports = { ASIN_PATTERN, isValidAsin };
