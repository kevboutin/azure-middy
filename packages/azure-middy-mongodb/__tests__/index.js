const mongoose = require("mongoose");
const test = require("ava");
const sinon = require("sinon");
const middy = require("../../azure-middy-core/index.js");
const { mongodbMiddleware, disconnect } = require("../index.js");
const { getInternal } = require("@kevboutin/azure-middy-util");

let sandbox, stub;
test.beforeEach(async (t) => {
    sandbox = sinon.createSandbox();
});

test.afterEach(async (t) => {
    await disconnect();
    sandbox.restore();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test.serial(
    "It should create connection and set to internal storage",
    async (t) => {
        const connObject = {
            readyState: 1,
            disconnect: () => {},
        };
        stub = sandbox.stub(mongoose, "createConnection").resolves(connObject);
        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            sinon.assert.calledOnce(stub);
            t.deepEqual(values.connection, connObject);
        };

        handler.use(mongodbMiddleware()).before(middleware);

        await handler(context, req);
    },
);

test.serial(
    "It should create connection and set to internal storage and use cache on subsequent call",
    async (t) => {
        const connObject = {
            readyState: 1,
            disconnect: () => {},
        };
        stub = sandbox.stub(mongoose, "createConnection").resolves(connObject);
        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            sinon.assert.calledOnce(stub);
            t.deepEqual(values.connection, connObject);
        };

        handler.use(mongodbMiddleware()).before(middleware);

        await handler(context, req);
        await handler(context, req);
    },
);
