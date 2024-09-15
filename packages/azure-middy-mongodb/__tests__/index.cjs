const mongoose = require("mongoose");
const test = require("ava");
const sinon = require("sinon");
const middy = require("../../azure-middy-core/index.cjs");
const {
    changeDatabase,
    mongodbMiddleware,
    disconnect,
} = require("../index.cjs");
const { getInternal } = require("@kevboutin/azure-middy-util");

/** @type {sinon.SinonSandbox} */
let sandbox;
let stub;
let mockConnection;

test.beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Create a mock connection object
    mockConnection = {
        readyState: 1,
        name: "testdb",
        host: "localhost",
        useDb: sandbox.stub(),
        close: sandbox.stub(),
    };
});

test.afterEach(() => {
    if (stub && stub.restore) {
        stub.restore();
    }
    sandbox.restore();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test.serial(
    "It should create connection and set to internal storage and use cache on subsequent call",
    async (t) => {
        const consoleLogStub = sandbox.stub(console, "log");
        const createConnectionStub = sandbox
            .stub(mongoose, "createConnection")
            .resolves(mockConnection);

        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            console.log("Middleware values:", JSON.stringify(values, null, 2));
            t.truthy(
                values.connection,
                "Connection should be set in internal storage",
            );
            t.deepEqual(
                values.connection,
                mockConnection,
                "Connection object should match the mock",
            );
        };

        handler.use(mongodbMiddleware()).before(middleware);

        await handler(context, req);
        await handler(context, req);
        await disconnect();
    },
);

test.serial("should change the database successfully", async (t) => {
    const consoleLogStub = sandbox.stub(console, "log");
    const newDbName = "newTestDb";
    const mockNewConnection = { name: newDbName };
    mockConnection.useDb.returns(mockNewConnection);

    const result = await changeDatabase(mockConnection, newDbName);

    t.is(result, mockNewConnection);
    t.true(mockConnection.useDb.calledWith(newDbName));
    t.true(consoleLogStub.calledWith("Changing database to:", newDbName));
});

test.serial("should handle errors when changing database", async (t) => {
    const consoleErrorStub = sandbox.stub(console, "error");
    const newDbName = "errorDb";
    const mockError = new Error("Database change error");
    mockConnection.useDb.throws(mockError);

    await t.throwsAsync(() => changeDatabase(mockConnection, newDbName), {
        instanceOf: Error,
        message: "Database change error",
    });

    t.true(mockConnection.useDb.calledWith(newDbName));
    t.true(
        consoleErrorStub.calledWith(
            `Error changing database to ${newDbName}`,
            mockError,
        ),
    );
});
