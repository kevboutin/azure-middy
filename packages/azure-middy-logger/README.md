# azure-middy-logger

Logger middleware for the azure-middy framework, the Node.js middleware engine for Azure functions.

## Install

To install the logger middleware, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-logger
```

## Prerequisites

- Node.js >= 18
- An Azure Function App

## Usage

The middleware provides logging capabilities for your Azure Functions using the azure-function-log-intercept library:

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const loggerMiddleware = require("@kevboutin/azure-middy-logger");

// Your handler
const baseHandler = async (req, context) => {
    // Your business logic here
    // Logging is automatically handled by the middleware
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Wrap handler with middy
const handler = middy(baseHandler).use(loggerMiddleware());

module.exports = { handler };

app.http("yourFunction", {
    route: "your-route",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

## How it works

The logger middleware uses the `azure-function-log-intercept` library to intercept and handle logging in your Azure Functions. It automatically:

1. Intercepts the Azure Function context
2. Handles log routing
3. Ensures proper log formatting
4. Maintains context across async operations

## Documentation and examples

For more documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
