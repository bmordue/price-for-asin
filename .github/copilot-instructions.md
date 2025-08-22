# Price for ASIN Service

Price for ASIN is a Node.js web service that looks up Amazon UK product prices by ASIN (Amazon Standard Identification Number). The service provides a simple HTTP API that scrapes Amazon's mobile site and returns price information in JSON format.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Dependencies
- Install dependencies: `npm install` -- takes 25-30 seconds. NEVER CANCEL. Set timeout to 3+ minutes.
  - Updates package-lock.json from old npm version format (on first run)
  - Shows deprecation warnings for rimraf, inflight, and glob packages (expected)
  - May show security vulnerabilities with `npm audit` (expected for older dependencies)
  - Creates node_modules directory with 167+ packages

### Building and Testing  
- Build: No explicit build step required - this is a runtime Node.js application
- Run tests: `npm test` -- takes 20-31ms but **WILL FAIL** in sandboxed environments
  - Tests fail with `ENOTFOUND www.amazon.co.uk` due to network restrictions
  - This is expected behavior in isolated environments - not a code problem
  - Tests validate the `fetchPriceForAsin` function with real Amazon requests
  - Shows 2 failing tests, 0 passing when network restricted
- Run coverage analysis: `./node_modules/.bin/nyc --reporter=lcov --reporter=text-lcov npm test`
  - Coverage tools are installed and functional
  - Will fail with same network errors but generates coverage data

### Running the Application
- Start server: `npm start` or `node app.js`
  - Starts HTTP server on port 3000 (configurable via `PRICE_FOR_ASIN_PORT` environment variable)
  - Server logs in structured JSON format to stdout
  - Ready when you see: `{"level":" INFO","message":"Server price-to-asin listening on port 3000"}`

### Docker Support  
- **DO NOT USE** the provided `build.sh` script - it fails due to outdated Node.js 8 Docker image
- The Dockerfile references `node:8.10-alpine` which is incompatible with current npm packages
- For Docker deployment, manually update Dockerfile to use `node:20-alpine` or later

## API Testing and Validation

### Manual Validation Scenarios
After making changes, **ALWAYS** test these scenarios:

1. **Valid API Request** (will fail in sandboxed environments):
   ```bash
   curl -i "http://localhost:3000/price?asin=B014V4DXMW"
   # Expected in production: 200 OK with JSON {"price": 12.99, "currency": "GBP"}
   # In sandbox: 404 Not Found due to network restrictions
   ```

2. **Missing ASIN Parameter**:
   ```bash
   curl -i "http://localhost:3000/price"
   # Expected: 400 Bad Request with {"error":"No ASIN in query string"}
   ```

3. **Invalid Endpoint**:
   ```bash  
   curl -i "http://localhost:3000/invalid"
   # Expected: 404 HTML error page from finalhandler middleware
   ```

4. **Server Logs Validation**:
   - Check that structured JSON logs appear in stdout during requests
   - Verify log levels: INFO, ERROR are properly formatted with timestamps
   - Confirm ASIN parameter logging: `"ASIN in query string: ","details":{"asin":"B014V4DXMW"}`
   - Error handling logs: `"fetchPriceForAsin returned err","details":{"errno":-3007,"code":"ENOTFOUND"}`

5. **Environment Variable Testing**:
   ```bash
   PRICE_FOR_ASIN_PORT=3001 node app.js
   # Test custom port: curl -i "http://localhost:3001/price"
   ```

### Expected Network Limitations
- **Production environment**: Application successfully fetches prices from Amazon UK mobile site
- **Sandboxed/CI environments**: All external requests fail with `ENOTFOUND` DNS resolution errors  
- **Test behavior**: 2 failing tests, 0 passing is expected in network-restricted environments
- This is normal and expected - document as "External API tests require internet access to www.amazon.co.uk"

## Common Tasks

### Environment Variables
- `PRICE_FOR_ASIN_PORT`: Server port (default: 3000)  
- `STATSD_HOST`: StatsD metrics host (default: localhost)
- `AMZN_RECS_LOG_LEVEL`: Logging verbosity (ERROR, WARN, INFO, DEBUG)

### Key Files and Their Purpose
- `app.js`: Main HTTP server with router and error handling
- `fetch.js`: Amazon price scraping logic using needle HTTP client
- `log.js`: Structured JSON logging utilities
- `test/fetch.test.js`: Mocha tests for price fetching functionality
- `package.json`: Dependencies and npm scripts
- `Dockerfile`: Container definition (needs Node.js version update)

### Repository Structure
```
/home/runner/work/price-for-asin/price-for-asin/
├── app.js                 # Main HTTP server
├── fetch.js               # Price scraping logic  
├── log.js                 # Logging utilities
├── package.json           # Node.js dependencies
├── test/
│   └── fetch.test.js      # Mocha tests
├── .github/
│   └── workflows/         # GitHub Actions (CodeQL only)
├── infrastructure/
│   └── deploy/            # Deployment scripts
└── out/                   # HTML dump directory for debugging
```

### CI/CD Pipeline Requirements
- **GitHub Actions**: Only CodeQL security analysis is configured
- **No linting**: No ESLint, Prettier, or other code quality tools detected
- **No additional validation**: Tests are the only automated quality check
- **Travis CI**: Legacy configuration exists but uses very old Node.js versions

## Important Limitations and Warnings

### Network Dependencies
- **CRITICAL**: Application requires internet access to Amazon UK for normal operation
- Tests and price fetching **WILL FAIL** in environments without external internet access
- This is expected behavior, not a bug

### Node.js Version Compatibility
- **Current**: Developed for Node.js 8 but works with modern versions (tested on Node.js 20+)
- **Recommended**: Node.js 16+ for best compatibility with current npm packages
- **Docker**: build.sh script fails due to outdated base image
- **Dependencies**: Some npm packages show deprecation warnings (normal)

### StatsD Integration
- Application includes StatsD metrics collection
- Will attempt to connect to localhost:8125 by default
- Connection failures are silent and don't affect functionality

### No Build Step Required
- This is a runtime Node.js application, not a compiled project
- Simply run `node app.js` after `npm install`
- No webpack, TypeScript compilation, or other build processes

## Validation Summary - Verified Commands

**All commands below have been tested and verified to work correctly:**

### Setup Commands (REQUIRED EVERY TIME)
```bash
cd /home/runner/work/price-for-asin/price-for-asin
node -v && npm -v           # Verify Node.js 16+ and npm versions
npm install                 # 25-30 seconds, creates node_modules/
```

### Development Commands  
```bash
npm start                    # Starts server on port 3000
node app.js                  # Alternative server start
npm test                     # Runs tests (fails in sandbox - expected)
PRICE_FOR_ASIN_PORT=3001 node app.js  # Custom port example
AMZN_RECS_LOG_LEVEL=DEBUG node app.js # Enable debug logging
```

### Validation Commands (COPY-PASTE READY)
```bash
# Test missing ASIN (should return 400):
curl -i "http://localhost:3000/price"
# Expected output: HTTP/1.1 400 Bad Request with {"error":"No ASIN in query string"}

# Test invalid endpoint (should return 404 HTML):  
curl -i "http://localhost:3000/invalid"
# Expected output: HTTP/1.1 404 Not Found with HTML "Cannot GET /invalid"

# Test valid ASIN (returns 404 in sandbox due to network):
curl -i "http://localhost:3000/price?asin=B014V4DXMW"
# Expected output: HTTP/1.1 404 Not Found with {"error":"Resource not found: /price?asin=B014V4DXMW"}
```

### Coverage Analysis
```bash
./node_modules/.bin/nyc --reporter=lcov --reporter=text-lcov npm test
```

### Failed Commands (DO NOT USE)
```bash
./build.sh        # FAILS - Node.js 8 Docker image compatibility issues
docker build .    # FAILS - Same Node.js 8 compatibility issues  
```

## Troubleshooting

### Common Issues
- **Test failures**: Expected in sandboxed environments due to network restrictions
- **Docker build failures**: Update Dockerfile Node.js version from 8 to 20+  
- **Missing ASINs in requests**: Check query parameter format `?asin=XXXXXXXXXX`
- **Port conflicts**: Set `PRICE_FOR_ASIN_PORT` environment variable

### Debug Mode
- Set `AMZN_RECS_LOG_LEVEL=DEBUG` for verbose logging
- HTML dumps are saved to `/out` directory when parsing fails
- Check server logs for structured error information