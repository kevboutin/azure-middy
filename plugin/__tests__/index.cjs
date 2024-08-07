const test = require("ava");
const middy = require("../../packages/azure-middy-core/index.cjs");

const { timePlugin } = require("../hrtime.cjs");

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

const middleware = (opts = {}) => {
    const middlewareBefore = (request) => {};
    const middlewareAfter = (request) => {};
    const middlewareOnError = (request) => {
        if (request.response !== undefined) return;
        middlewareAfter(request);
    };
    return {
        before: middlewareBefore,
        after: middlewareAfter,
        onError: middlewareOnError,
    };
};

const middlewareAsync = (opts = {}) => {
    const middlewareBefore = async (request) => {};
    const middlewareAfter = async (request) => {};
    const middlewareOnError = async (request) => {
        if (request.response !== undefined) return;
        await middlewareAfter(request);
    };
    return {
        before: middlewareBefore,
        after: middlewareAfter,
        onError: middlewareOnError,
    };
};

// hrtime
test.serial("Should run with hrtime plugin", async (t) => {
    const output = {};
    const logger = (id, value) => {
        output[id] = value;
    };
    const plugin = timePlugin({ logger });

    const functionHandler = () => {};

    const handler = middy(functionHandler, plugin);

    await handler(context, req);
    t.deepEqual(
        Object.keys(output),
        Object.keys({
            prefetch: 0.1,
            handler: 0.1,
            request: 0.2,
        }),
    );
});

test.serial("Should run with hrtime plugin and middleware", async (t) => {
    const output = {};
    const logger = (id, value) => {
        output[id] = value;
    };
    const plugin = timePlugin({ logger });
    const functionHandler = () => {};

    const handler = middy(functionHandler, plugin).use(middleware());

    await handler(context, req);
    t.deepEqual(
        Object.keys(output),
        Object.keys({
            prefetch: 0.1,
            middlewareBefore: 0.025,
            handler: 0.1,
            middlewareAfter: 0.025,
            request: 0.25,
        }),
    );
});

test.serial("Should run with hrtime plugin and async middleware", async (t) => {
    const output = {};
    const logger = (id, value) => {
        output[id] = value;
    };
    const plugin = timePlugin({ logger });
    const functionHandler = () => {};

    const handler = middy(functionHandler, plugin).use(middlewareAsync());

    await handler(context, req);
    t.deepEqual(
        Object.keys(output),
        Object.keys({
            prefetch: 0.1,
            middlewareBefore: 0.025,
            handler: 0.1,
            middlewareAfter: 0.025,
            request: 0.25,
        }),
    );
});
