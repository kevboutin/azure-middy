import mongoose, { Connection } from "mongoose";
import {
    MongoDBMiddlewareOptions,
    MongoDBMiddleware,
    MongoDBConnection,
} from "./typings";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

let connection: Connection | null = null;
const mongodbUri: string =
    process.env["MONGO_URI"] || "mongodb://localhost:27017";
const defaults: MongoDBMiddlewareOptions = {
    serverSelectionTimeoutMS: 5000,
};

/**
 * Provides an updated database connection to the specified database.
 *
 * @param conn - The current database connection.
 * @param databaseName - The name of the database to switch to.
 * @returns The new database connection object if successful, otherwise an error message.
 * @throws If there is an error changing the database.
 */
const changeDatabase = async (
    conn: Connection,
    databaseName: string,
): Promise<Connection> => {
    console.log("Changing database to:", databaseName);
    try {
        const newConn = conn.useDb(databaseName);
        connection = newConn;
        return newConn;
    } catch (err) {
        console.error(`Error changing database to ${databaseName}`, err);
        throw err;
    }
};

/**
 * Disconnects from the database cluster.
 *
 * @param conn - The database connection.
 * @returns Returns a promise that resolves to null if the disconnection is successful, or an Error object if there is an error.
 * @throws If there is an error disconnecting from the database.
 */
const disconnect = async (conn: Connection): Promise<Error | null> => {
    console.log("Disconnecting from MongoDB");
    try {
        if (conn) {
            await conn.close();
            connection = null;
        }
        if (connection !== null) {
            await connection.close();
            return null;
        }
        return null;
    } catch (err) {
        console.error("Error disconnecting from the database:", err);
        throw err;
    }
};

/**
 * Determines if the database connection is alive/active.
 *
 * @param conn The database connection.
 * @return True if the connection is still considered active.
 */
const isConnectionAlive = async (conn: Connection): Promise<boolean> => {
    if (!conn) return false;
    console.log("Database connection readyState:", conn.readyState);
    // Return false if not connected or connecting
    if (conn.readyState !== 1 && conn.readyState !== 2) return false;
    try {
        const adminUtil = conn.db?.admin();
        if (!adminUtil) return false;
        const result = await adminUtil.ping();
        // Example result: { ok: 1 }
        console.log("Ping result: ", result);
        return result?.["ok"] === 1;
    } catch (error) {
        console.log("Error with ping: ", error);
        return false;
    }
};

/**
 * Connects to a MongoDB database cluster using Mongoose.
 *
 * @param opts - Optional parameters for creating the connection.
 * @returns A promise that resolves to the database connection.
 * @throws If there is an error connecting to the database.
 */
const connect = async (
    opts: MongoDBMiddlewareOptions = {},
): Promise<Connection> => {
    // Log the MongoDB URI securely
    const secureUri = mongodbUri.replace(/\/\/.*@/, "//***:***@");
    console.log("Connecting to MongoDB at:", secureUri);

    // If connection is already established, return it
    if (connection !== null) {
        const isAlive = await isConnectionAlive(connection);
        if (isAlive) return connection;
    }

    try {
        // Connect to MongoDB using Mongoose
        if (typeof mongoose.createConnection().asPromise === "function") {
            // For newer versions of Mongoose that support asPromise
            connection = await mongoose
                .createConnection(mongodbUri, opts)
                .asPromise();
            console.log(
                `Connected via asPromise to database ${connection.name} at ${connection.host}`,
            );
        } else {
            // For older versions of Mongoose
            connection = mongoose.createConnection(mongodbUri, opts);
            console.log(
                `Connected to database ${connection.name} at ${connection.host}`,
            );
        }

        // Return the database connection
        return connection;
    } catch (err) {
        console.error("Error connecting to database:", err);
        throw err;
    }
};

/**
 * Middleware function for connecting to a MongoDB cluster.
 *
 * @param opts - Options for connecting to a MongoDB cluster.
 * @returns Middleware object with 'before' function.
 */
const mongodbMiddleware = (
    opts: MongoDBMiddlewareOptions = {},
): MongoDBMiddleware => {
    const options: MongoDBMiddlewareOptions = { ...defaults, ...opts };

    /**
     * Middleware function that handles the MongoDB connection before processing the request.
     *
     * @param request - The request object.
     * @returns A promise that resolves when the connection is established.
     */
    const mongodbMiddlewareBefore = async (
        request: AzureFunctionRequest,
    ): Promise<void> => {
        if (!connection) {
            console.log(
                "Connecting to MongoDB as global connection was not yet set",
            );
            try {
                connection = await connect(options);
                console.log("MongoDB connection created:", connection);
            } catch (err) {
                console.error("Failed to connect to MongoDB:", err);
                throw err;
            }
        } else if (connection.readyState === 1 || connection.readyState === 2) {
            console.log("Connection is cached");
        } else {
            console.log("Reconnecting to MongoDB");
            try {
                connection = await connect(options);
            } catch (err) {
                console.error("Failed to reconnect to MongoDB:", err);
                throw err;
            }
        }

        if (request.internal) {
            request.internal.connection = {};
            Object.assign(request.internal.connection, connection);
        }
    };

    return {
        before: mongodbMiddlewareBefore,
    };
};

// Export the functions for use in other modules
const mongodbConnection: MongoDBConnection = {
    changeDatabase,
    disconnect,
    mongodbMiddleware,
};

export default mongodbConnection;
export { changeDatabase, disconnect, mongodbMiddleware };
export type { MongoDBMiddlewareOptions, MongoDBMiddleware, MongoDBConnection };
