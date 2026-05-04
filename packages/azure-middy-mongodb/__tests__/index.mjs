import { test, expect, beforeEach, afterEach } from 'vitest';
import mongoose from "mongoose";
import sinon from "sinon";
import middy from "../../azure-middy-core/dist/index.js";
import { changeDatabase, mongodbMiddleware, disconnect } from "../dist/index.js";
import { getInternal } from "@kevboutin/azure-middy-util";

/** @type {sinon.SinonSandbox} */
let sandbox;
let stub;
let mockConnection;

beforeEach(() => {
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

afterEach(() => {
    if (stub && stub.restore) {
        stub.restore();
    }
    sandbox.restore();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test(
    "It should create connection and set to internal storage and use cache on subsequent call",
    async () => {
        sandbox.stub(console, "log");
        sandbox.stub(mongoose, "createConnection").resolves(mockConnection);

        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            console.log("Middleware values:", JSON.stringify(values, null, 2));
            expect(values.connection).toBeTruthy();
            expect(values.connection).toEqual(mockConnection);
        };

        handler.use(mongodbMiddleware()).before(middleware);

        await handler(context, req);
        await handler(context, req);
        await disconnect();
    },
);

test("should change the database successfully", async () => {
    const consoleLogStub = sandbox.stub(console, "log");
    const newDbName = "newTestDb";
    const mockNewConnection = { name: newDbName };
    mockConnection.useDb.returns(mockNewConnection);

    const result = await changeDatabase(mockConnection, newDbName);

    expect(result).toBe(mockNewConnection);
    expect(mockConnection.useDb.calledWith(newDbName)).toBe(true);
    expect(consoleLogStub.calledWith("Changing database to:", newDbName)).toBe(true);
});

test("should handle errors when changing database", async () => {
    const consoleErrorStub = sandbox.stub(console, "error");
    const newDbName = "errorDb";
    const mockError = new Error("Database change error");
    mockConnection.useDb.throws(mockError);

    await expect(() => changeDatabase(mockConnection, newDbName)).rejects.toThrow(
        "Database change error",
    );

    expect(mockConnection.useDb.calledWith(newDbName)).toBe(true);
    expect(
        consoleErrorStub.calledWith(
            `Error changing database to ${newDbName}`,
            mockError,
        ),
    ).toBe(true);
});
