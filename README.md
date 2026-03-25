# price-for-asin

Look up an Amazon UK product price given an ASIN (Amazon Standard Identification Number).

## Overview

`price-for-asin` is a lightweight Node.js HTTP service that accepts an ASIN via a query parameter and returns the product price scraped from the Amazon UK mobile site.

## Requirements

- Node.js 16 or later
- npm

## Setup

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server starts on port **3000** by default. To use a different port, set the `PRICE_FOR_ASIN_PORT` environment variable:

```bash
PRICE_FOR_ASIN_PORT=8080 npm start
```

## API

### `GET /price?asin=<ASIN>`

Returns the price for the given ASIN.

**Parameters**

| Name | Required | Description |
|------|----------|-------------|
| `asin` | Yes | A valid Amazon ASIN (10 uppercase alphanumeric characters, e.g. `B014V4DXMW`) |

**Success Response** – `200 OK`

```json
{
    "price": 12.99,
    "currency": "GBP"
}
```

**Error Responses**

| Status | Condition |
|--------|-----------|
| `400 Bad Request` | Missing or invalid `asin` parameter |
| `404 Not Found` | Price could not be retrieved (unknown ASIN, scraping failure, etc.) |

**Examples**

```bash
# Valid request
curl "http://localhost:3000/price?asin=B014V4DXMW"

# Missing ASIN – returns 400
curl "http://localhost:3000/price"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRICE_FOR_ASIN_PORT` | `3000` | HTTP server port |
| `STATSD_HOST` | `localhost` | StatsD metrics host |
| `AMZN_RECS_LOG_LEVEL` | `DEBUG` | Log verbosity (`ERROR`, `WARN`, `INFO`, `DEBUG`) |

## Running Tests

```bash
npm test
```

> **Note:** Tests that call `fetchPriceForAsin` require internet access to `www.amazon.co.uk`. In network-restricted environments (e.g. CI sandboxes) those tests will fail with `ENOTFOUND`. This is expected behaviour – it is not a code problem.

## Docker

```bash
docker build -t price-for-asin .
docker run -p 3000:3000 price-for-asin
```

## License

CC0 – see [LICENSE](LICENSE).
