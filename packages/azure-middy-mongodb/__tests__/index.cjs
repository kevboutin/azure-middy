const mongoose = require("mongoose");
const test = require("ava");
const sinon = require("sinon");
const middy = require("../../azure-middy-core/index.cjs");
const { mongodbMiddleware, disconnect } = require("../index.cjs");
const { getInternal } = require("@kevboutin/azure-middy-util");
const { changeDatabase } = require("../index.cjs");

/** @type {sinon.SinonSandbox} */
let sandbox;
let stub;
test.beforeEach(async (t) => {
    sandbox = sinon.createSandbox();
    // Create a mock connection object
    mockConnection = {
        useDb: sandbox.stub(),
        close: sandbox.stub(),
    };
    // Mock console.log and console.error
    sandbox.stub(console, "log");
    sandbox.stub(console, "error");
});

test.afterEach(async (t) => {
    stub.restore();
    sandbox.restore();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};
const connObject = {
    readyState: 1,
    name: "initialvalue",
    createConnection: () => {},
    close: () => {},
    useDb: (name) => {
        return {
            readyState: 1,
            name,
            createConnection: () => {},
            close: () => {},
            useDb: () => {},
        };
    },
};

test.serial(
    "It should create connection and set to internal storage and use cache on subsequent call",
    async (t) => {
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
        await disconnect();
    },
);

test.serial("should change the database successfully", async (t) => {
    const newDbName = "newTestDb";
    const mockNewConnection = { name: newDbName };
    mockConnection.useDb.returns(mockNewConnection);

    const result = await changeDatabase(mockConnection, newDbName);

    sinon.assert.calledWith(mockConnection.useDb, newDbName);
    t.is(result, mockNewConnection);
    sinon.assert.calledWith(console.log, "Changing database to:", newDbName);
});

test.serial("should handle errors when changing database", async (t) => {
    const newDbName = "errorDb";
    const mockError = new Error("Database change error");
    mockConnection.useDb.throws(mockError);

    const result = await changeDatabase(mockConnection, newDbName);

    sinon.assert.calledWith(mockConnection.useDb, newDbName);
    t.is(result, mockError);
    sinon.assert.calledWith(
        console.error,
        `Error changing database to ${newDbName}`,
        mockError,
    );
});
