# azure-middy-mongodb

MongoDB middleware for the azure-middy framework, the Node.js middleware engine for Azure functions.

## Install

To install the MongoDB middleware, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-mongodb
```

## Prerequisites

- Node.js >= 18
- A MongoDB instance (local or remote)
- Environment variable `MONGO_URI` set (defaults to "mongodb://localhost:27017")

## Usage

The middleware provides MongoDB connection management for your Azure Functions.

### JavaScript (CommonJS)

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const { mongodbMiddleware } = require("@kevboutin/azure-middy-mongodb");

// Your handler
const baseHandler = async (req, context) => {
    // Your business logic here
    // The MongoDB connection is available in req.internal.connection
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Wrap handler with middy
const handler = middy(baseHandler).use(
    mongodbMiddleware({
        serverSelectionTimeoutMS: 5000, // Optional configuration
    }),
);

module.exports = { handler };

app.http("yourFunction", {
    route: "your-route",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

### TypeScript

```typescript
import { app } from "@azure/functions";
import middy from "@kevboutin/azure-middy-core";
import {
    mongodbMiddleware,
    MongoDBMiddlewareOptions,
} from "@kevboutin/azure-middy-mongodb";

// Your handler
const baseHandler = async (req: any, context: any) => {
    // Your business logic here
    // The MongoDB connection is available in req.internal.connection
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Wrap handler with middy
const handler = middy(baseHandler).use(
    mongodbMiddleware({
        serverSelectionTimeoutMS: 5000, // Optional configuration
    } as MongoDBMiddlewareOptions),
);

export { handler };

app.http("yourFunction", {
    route: "your-route",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

## Connection Management

The middleware automatically handles:

- Connection creation on first request
- Connection reuse across requests
- Connection health checks
- Reconnection if the connection is lost
- Safe connection closure

## TypeScript Support

This package includes full TypeScript support with:

- **Type Definitions**: Complete type definitions for all exported functions and interfaces
- **Type Safety**: Full type checking for middleware options and request objects
- **IntelliSense**: Enhanced IDE support with autocomplete and type hints

### Available Types

```typescript
import {
    MongoDBMiddlewareOptions,
    AzureFunctionRequest,
    MongoDBMiddleware,
    MongoDBConnection,
} from "@kevboutin/azure-middy-mongodb";
```

### TypeScript Configuration

To use TypeScript with this package, ensure your `tsconfig.json` includes:

```json
{
    "compilerOptions": {
        "esModuleInterop": true,
        "moduleResolution": "node"
    }
}
```

## Environment Variables

- `MONGO_URI`: MongoDB connection string (default: "mongodb://localhost:27017")

## Documentation and examples

For documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
