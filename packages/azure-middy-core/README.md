# Azure-Middy-Core

<div align="center">
  <p><strong>Core component of the azure-middy framework, the Node.js middleware engine for Azure functions</strong></p>
</div>

## Install

To install middy you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-core
```

## Usage

The core middleware engine provides a powerful way to compose Azure Functions with middleware.

### JavaScript (CommonJS)

```javascript
const middy = require("@kevboutin/azure-middy-core");

const baseHandler = async (req, context) => {
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

const handler = middy(baseHandler)
    .use(loggingMiddleware)
    .use(errorHandlingMiddleware);

module.exports = { handler };
```

### TypeScript

```typescript
import middy, {
    MiddyInstance,
    Middleware,
    Plugin,
    AzureFunctionRequest,
} from "@kevboutin/azure-middy-core";

const baseHandler = async (req: any, context: any) => {
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

const loggingMiddleware: Middleware = {
    before: async (request: AzureFunctionRequest) => {
        console.log("Request:", request.req.method, request.req.url);
    },
    after: async (request: AzureFunctionRequest) => {
        console.log("Response:", request.response);
    },
    onError: async (request: AzureFunctionRequest) => {
        console.error("Error:", request.error);
    },
};

const monitoringPlugin: Plugin = {
    requestStart: () => console.log("Request started"),
    requestEnd: () => console.log("Request ended"),
};

const handler: MiddyInstance = middy(baseHandler, monitoringPlugin).use(
    loggingMiddleware,
);

export { handler };
```

## TypeScript Support

This package includes full TypeScript support with:

- **Type Definitions**: Complete type definitions for all middleware interfaces and functions
- **Type Safety**: Full type checking for middleware, plugins, and request objects
- **IntelliSense**: Enhanced IDE support with autocomplete and type hints

### Available Types

```typescript
import {
    MiddyInstance,
    Middleware,
    Plugin,
    AzureFunctionRequest,
    MiddlewareFunction,
    BaseHandler,
} from "@kevboutin/azure-middy-core";
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

## Documentation and examples

For more documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin, and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
