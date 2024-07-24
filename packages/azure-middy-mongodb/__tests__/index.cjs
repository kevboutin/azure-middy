const mongoose = require("mongoose");
const test = require("ava");
const sinon = require("sinon");
const middy = require("../../azure-middy-core/index.cjs");
const { mongodbMiddleware, disconnect } = require("../index.cjs");
const { getInternal } = require("@kevboutin/azure-middy-util");

/** @type {sinon.SinonSandbox} */
let sandbox;
let stub;
test.beforeEach(async (t) => {
    sandbox = sinon.createSandbox();
});

test.afterEach(async (t) => {
    stub.restore();
    sandbox.restore();
    await disconnect();
});

//test.after(async (t) => {
//    await disconnect();
//});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test.serial(
    "It should create connection and set to internal storage and use cache on subsequent call",
    async (t) => {
        const connObject = {
            readyState: 1,
            createConnection: () => {},
            close: () => {},
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
