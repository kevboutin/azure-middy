# azure-middy-util

Utility functions for the azure-middy framework, the Node.js middleware engine for Azure functions.

## Install

To install the utility package, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-util
```

## Prerequisites

- Node.js >= 18

## Usage

The utility package provides common functions used across azure-middy middlewares:

```javascript
const {
    normalizeHttpResponse,
    jsonSafeParse,
} = require("@kevboutin/azure-middy-util");

// Example: Parse JSON safely
const result = jsonSafeParse('{"key": "value"}');
console.log(result); // { key: 'value' }

// Example: Normalize HTTP response
const request = {
    response: "Hello World",
};
normalizeHttpResponse(request);
console.log(request.response); // { body: 'Hello World', headers: {}, statusCode: 200 }
```

## API

### JSON Utilities

#### jsonSafeParse(string)

Safely parses a JSON string, returning the parsed object or the original string if parsing fails.

```javascript
const obj = jsonSafeParse('{"valid": "json"}'); // Returns object
const str = jsonSafeParse("invalid json"); // Returns 'invalid json'
```

#### jsonSafeStringify(value)

Safely stringifies a value to JSON, handling circular references.

```javascript
const str = jsonSafeStringify({ key: "value" }); // Returns '{"key":"value"}'
```

### HTTP Utilities

#### normalizeHttpResponse(request)

Normalizes HTTP responses to a standard format:

```javascript
// Before
request.response = "Hello";
// After normalizeHttpResponse(request)
request.response = {
    body: "Hello",
    headers: {},
    statusCode: 200,
};
```

### Cache Utilities

#### processCache(request, opts)

Processes and manages cached data with expiry.

```javascript
const result = processCache(request, {
    cacheKey: "myKey",
    cacheExpiry: 60000, // 1 minute
    fetch: () => "cached value",
});
```

#### getCache(key)

Retrieves cached data for a given key.

```javascript
const cached = getCache("myKey");
```

#### modifyCache(key, value)

Modifies cached data for a given key.

```javascript
modifyCache("myKey", "new value");
```

#### clearCache()

Clears all cached data.

```javascript
clearCache();
```

### Internal State Utilities

#### getInternal(boolean, request)

Gets or creates internal storage in the request object.

```javascript
const internal = getInternal(true, request);
```

## Common Use Cases

1. HTTP Response Normalization

    ```javascript
    const handler = middy((req, context) => {
        return "Hello World";
    });

    handler.after(async (request) => {
        normalizeHttpResponse(request);
        request.response.headers["Content-Type"] = "text/plain";
    });
    ```

2. Caching with Expiry

    ```javascript
    const handler = middy((req, context) => {
        const cached = processCache(req, {
            cacheKey: "data",
            cacheExpiry: 300000, // 5 minutes
            fetch: () => fetchExpensiveData(),
        });
        return cached.value;
    });
    ```

3. Safe JSON Operations

    ```javascript
    const handler = middy((req, context) => {
        const body = jsonSafeParse(req.body);
        return jsonSafeStringify(body);
    });
    ```

## Documentation and examples

For more documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
