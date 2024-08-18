# azure-middy

A Node.js middleware engine for Azure functions

This project was inspired by https://github.com/middjs/middy but made specifically for Azure functions instead of lambdas on AWS.

## What is Azure-Middy

Azure-Middy is a very simple middleware engine that allows you to simplify your Azure function code when using Node.js. Release tag 0.1.1 of this repository worked with v3 Azure functions. Release tag 0.2.0 works with v4 Azure functions.

If you have used web frameworks like Express, then you will be familiar with the concepts adopted in Azure-Middy and you will be able to get started very quickly.

A middleware engine allows you to focus on the strict business logic of your serverless function and then attach additional common elements like authentication, authorization, validation, serialization, etc. in a modular and reusable way by decorating the main business logic.

## Install

To install azure-middy, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-core
```

## Quick example

Code is better than 10,000 words, so let's jump into an example.
Let's assume you are building a JSON API to process a payment:

```javascript
//# handler.js #
const { app } = require("@azure/functions");

// import core
const middy = require("@kevboutin/azure-middy-core");

// import some middlewares
const loggerMiddleware = require("@kevboutin/azure-middy-logger");
const secretMiddleware = require("@kevboutin/azure-middy-keyvault-secrets");
const { mongodbMiddleware } = require("@kevboutin/azure-middy-mongodb");

// This is your common handler, in no way different than what you are used to doing every day in Azure functions
const baseHandler = async (req, context) => {
    const {
        creditCardNumber,
        expiryMonth,
        expiryYear,
        cvc,
        nameOnCard,
        amount,
    } = req.body;

    // do stuff with this data
    // ...

    return {
        body: JSON.stringify({
            result: "success",
            message: "payment processed successfully",
        }),
    };
};

// Let's "middyfy" our handler, then we will be able to attach middlewares to it
const handler = middy(baseHandler)
    .use(loggerMiddleware())
    .use(
        secretMiddleware({
            vaultUrl:
                process.env.VAULT_URL ||
                "https://azure_keyvault.vault.azure.net",
            cacheExpiry: -1,
            fetchData: {
                somesecret: "api_key",
            },
        }).use(mongodbMiddleware()),
    );

module.exports = { handler };

app.http("processPayment", {
    route: "payment",
    methods: ["POST"],
    authLevel: "anonymous",
    handler: handler,
});
```

## Why?

One of the main strengths of serverless and Azure functions is that, from a developer perspective, your focus is mostly shifted toward implementing business logic.

Anyway, when you are writing a handler, you still have to deal with some common technical concerns outside business logic, like input parsing and validation, output serialization, error handling, etc.

Very often, all this necessary code ends up polluting the pure business logic code in your handlers, making the code harder to read and to maintain.

In other contexts, like generic web frameworks ([fastify](http://fastify.io), [hapi](https://hapijs.com/), [express](http://expressjs.com/), etc.), this problem has been solved using the [middleware pattern](https://www.packtpub.com/mapt/book/web_development/9781783287314/4/ch04lvl1sec33/middleware).

This pattern allows developers to isolate these common technical concerns into _"steps"_ that _decorate_ the main business logic code.
Middleware functions are generally written as independent modules and then plugged into the application in a configuration step, thus not polluting the main business logic code that remains clean, readable, and easy to maintain.

Since we could not find a similar approach for Azure function handlers, we decided to create azure-middy, our own middleware framework for serverless in Azure land.

## Usage

As you might have already seen from our first example here, using azure-middy is very simple and requires just few steps:

1.  Write your function handlers as usual, focusing mostly on implementing the bare business logic for them.
2.  Import `middy` and all the middlewares you want to use.
3.  Wrap your handler in the `middy()` factory function. This will return a new enhanced instance of your original handler, to which you will be able to attach the middlewares you need.
4.  Attach all the middlewares you need using the function `.use(somemiddleware())`

Example:

```javascript
const { app } = require("@azure/functions");
const middy from "@kevboutin/azure-middy-core";
const middleware1 = require("sample-middleware1");
const middleware2 = require("sample-middleware2");
const middleware3 = require("sample-middleware3");

const baseHandler = (req, context) => {
    /* your business logic */
};

const handler = middy(baseHandler);

handler.use(middleware1()).use(middleware2()).use(middleware3());

module.exports = { handler };

app.http("getSomething", {
    route: "something",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

`.use()` takes a single middleware or an array of middlewares, so you can attach multiple middlewares in a single call:

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const middleware1 = require("sample-middleware1");
const middleware2 = require("sample-middleware2");
const middleware3 = require("sample-middleware3");
const middlewares = [middleware1(), middleware2(), middleware3()];

const baseHandler = (req, context) => {
    /* your business logic */
};

const handler = middy(baseHandler);

handler.use(middlewares);

module.exports = { handler };

app.http("getSomething", {
    route: "something",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

You can also attach [inline middlewares](#inline-middlewares) by using the functions `.before`, `.after` and `.onError`.

For a more detailed use case and examples check the [Writing a middleware section](#writing-a-middleware).

## How it works

Middy implements the classic _onion-like_ middleware pattern, with some peculiar details.

![Azure-Middy middleware engine diagram](/docs/img/azure-middy-middleware-engine.png)

When you attach a new middleware this will wrap the business logic contained in the handler in two separate steps.

When another middleware is attached this will wrap the handler again and it will be wrapped by all the previously added middlewares in order, creating multiple layers for interacting with the _request_ (event) and the _response_.

This way the _request-response cycle_ flows through all the middlewares, the handler and all the middlewares again, giving the opportunity within every step to modify or enrich the current request, context, or the response.

### Execution order

Middlewares have two phases: `before` and `after`.

The `before` phase, happens _before_ the handler is executed. In this code the response is not created yet, so you will have access only to the request.

The `after` phase, happens _after_ the handler is executed. In this code you will have access to both the request and the response.

If you have three middlewares attached (as in the image above), this is the expected order of execution:

-   `middleware1` (before)
-   `middleware2` (before)
-   `middleware3` (before)
-   `handler`
-   `middleware3` (after)
-   `middleware2` (after)
-   `middleware1` (after)

Notice that in the `after` phase, middlewares are executed in inverted order, this way the first handler attached is the one with the highest priority as it will be the first able to change the request and last able to modify the response before it gets sent to the user.

### Interrupt middleware execution early

Some middlewares might need to stop the whole execution flow and return a response immediately.

If you want to do this you can invoke `return response` in your middleware.

**Note**: this will totally stop the execution of successive middlewares in any phase (`before`, `after`, `onError`) and returns an early response (or an error) directly at the function level. If your middlewares do a specific task on every request like output serialization or error handling, these will not be invoked in this case.

In this example, we can use this capability for building a sample caching middleware:

```javascript
// some function that calculates the cache id based on the current context
const calculateCacheId = (context) => {
    /* ... */
};
const storage = {};

// middleware
const cacheMiddleware = (options) => {
    let cacheKey;

    const cacheMiddlewareBefore = async (request) => {
        cacheKey = options.calculateCacheId(request.context);
        if (options.storage.hasOwnProperty(cacheKey)) {
            // exits early and returns the value from the cache if it's already there
            return options.storage[cacheKey];
        }
    };

    const cacheMiddlewareAfter = async (request) => {
        // stores the calculated response in the cache
        options.storage[cacheKey] = request.response;
    };

    return {
        before: cacheMiddlewareBefore,
        after: cacheMiddlewareAfter,
    };
};

// sample usage
const handler = middy((req, context) => {
    /* ... */
}).use(
    cacheMiddleware({
        calculateCacheId,
        storage,
    }),
);
```

### Handling errors

But, what happens when there is an error?

When there is an error, the regular control flow is stopped and the execution is moved back to all the middlewares that implemented a special phase called `onError`, following the order they have been attached.

Every `onError` middleware can decide to handle the error and create a proper response or to delegate the error to the next middleware.

When a middleware handles the error and creates a response, the execution is still propagated to all the other error middlewares and they have a chance to update or replace the response as needed. At the end of the error middlewares sequence, the response is returned to the user.

If no middleware manages the error, the function execution fails and reports the unmanaged error.

```javascript
// Initialize response
request.response = request.response ?? {};

// Add to response
request.response.add = "more";

// Override an error
request.error = new Error("...");

// handle the error
return request.response;
```

## Writing a middleware

A middleware is an object that should contain at least 1 of 3 possible keys:

1.  `before`: a function that is executed in the before phase
2.  `after`: a function that is executed in the after phase
3.  `onError`: a function that is executed in case of errors

`before`, `after` and `onError` functions need to have the following signature:

```javascript
async (request) => {
    // ...
};
```

Where:

-   `request`: is a reference to the current context and allows access to (and modification of)
    the current `context`, the `req` (request), the `response` (in the _after_ phase), and `error`
    (in case of an error).

### Configurable middlewares

In order to make middlewares configurable, they are generally exported as a function that accepts a configuration object. This function should then return the middleware object with `before`, `after`, and `onError` as keys.

E.g.

```javascript
// customMiddleware.js

const defaults = {};

module.exports = (opts = {}) => {
    const options = { ...defaults, ...opts };

    const customMiddlewareBefore = async (request) => {
        // might read options
    };
    const customMiddlewareAfter = async (request) => {
        // might read options
    };
    const customMiddlewareOnError = async (request) => {
        // might read options
    };

    return {
        before: customMiddlewareBefore,
        after: customMiddlewareAfter,
        onError: customMiddlewareOnError,
    };
};
```

With this convention in mind, using a middleware will always look like the following example:

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const customMiddleware = require("customMiddleware.js");

const handler = middy(async (req, context) => {
    // do stuff
    return {};
});

handler.use(
    customMiddleware({
        option1: "foo",
        option2: "bar",
    }),
);

module.exports = { handler };

app.http("getSomething", {
    route: "something",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

### Inline middlewares

Sometimes you want to create handlers that serve a very small need and that are not necessarily re-usable. In such cases, you probably will need to hook only into one of the different phases (`before`, `after` or `onError`).

In these cases you can use **inline middlewares** which are shortcut functions to hook logic into Azure-Middy's control flow.

Observe how inline middlewares work with a simple example:

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");

const handler = middy((context, req) => {
    // do stuff
});

handler.before(async (request) => {
    // do something in the before phase
});

handler.after(async (request) => {
    // do something in the after phase
});

handler.onError(async (request) => {
    // do something in the on error phase
});

module.exports = { handler };

app.http("getSomething", {
    route: "something",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

As you can see above, a middy instance also exposes the `before`, `after` and `onError` methods to allow you to quickly hook in simple inline middlewares.

### Request caching & Internal storage

The handler also contains an `internal` object that can be used to store values securely between middlewares that expires when the event ends. To compliment this there is also a cache where middleware can store request promises.
During `before` these promises can be stored into `internal` then resolved only when needed. This pattern is useful to take advantage of the async nature of node especially when you have multiple middleware that require reaching out the external APIs.

Here is a middleware boilerplate using this pattern:

```javascript
const { getInternal, processCache } = require("@kevboutin/azure-middy-util");

const defaults = {
    fetchData: {}, // { internalKey: params }
    cacheKey: "custom",
    cacheExpiry: -1,
};

module.exports = (opts = {}) => {
    const options = { ...defaults, ...opts };

    const fetch = () => {
        const values = {};
        // Start your custom fetch
        for (const internalKey of Object.keys(options.fetchData)) {
            values[internalKey] = fetch(
                "...",
                options.fetchData[internalKey],
            ).then((res) => res.text());
        }
        // End your custom fetch
        return values;
    };

    let client;
    const customMiddlewareBefore = async (request) => {
        let cached;
        cached = processCache(options, fetch, request);

        Object.assign(request.internal, cached);
        Object.assign(
            process.env,
            await getInternal(Object.keys(options.fetchData), request),
        );
    };

    return {
        before: customMiddlewareBefore,
    };
};
```

### More details on creating middlewares

Check the [code for existing middlewares](/packages) to see more examples on how to write a middleware.

## Publishing Releases

Use the following command to publish the various packages from this repository. Afterward, use GitHub to generate a new release based on the root package.json version.

```shell
npm publish --workspaces
```

## Further Help

Microsoft has some good documentation to help develop Azure functions. Please refer to the following material:

-   [Node.js Azure Function Reference](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node?tabs=javascript%2Clinux%2Cazure-cli&pivots=nodejs-model-v4)
-   [Node.js Azure Function How-to Guide](https://learn.microsoft.com/en-us/azure/developer/javascript/how-to/develop-serverless-apps?tabs=v4-js)
