const mongoose = require("mongoose");

let connection = null;
const mongodbUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const defaults = {
    serverSelectionTimeoutMS: 5000,
};

/**
 * Provides an updated database connection to the specified database.
 *
 * @param {Object} conn - The current database connection.
 * @param {string} databaseName - The name of the database to switch to.
 * @returns {Object|string} - The new database connection object if successful, otherwise an error message.
 */
const changeDatabase = async (conn, databaseName) => {
    console.log("Changing database to:", databaseName);
    try {
        const newConn = conn.useDb(databaseName);
        connection = newConn;
        return newConn;
    } catch (err) {
        console.error(`Error changing database to ${databaseName}`, err);
        return err;
    }
};

/**
 * Disconnects from the database cluster.
 *
 * @returns {Promise<Error|null>} - Returns a promise that resolves to null if the disconnection is successful, or an Error object if there is an error.
 */
const disconnect = async () => {
    console.log("Disconnecting from MongoDB");
    try {
        if (connection) {
            await connection.close();
            connection = null;
        }
    } catch (err) {
        console.error("Error disconnecting from the database:", err);
        return err;
    }
};

/**
 * Connects to a MongoDB database cluster using Mongoose.
 *
 * @param {Object} opts - Optional parameters for creating the connection.
 * @returns {Promise<mongoose.Connection>} - A promise that resolves to the database connection.
 * @throws {Error} - If there is an error connecting to the database.
 */
const connect = async (opts = {}) => {
    // Log the MongoDB URI securely
    const secureUri = mongodbUri.replace(/\/\/.*@/, "//***:***@");
    console.log("Connecting to MongoDB:", secureUri);

    // If connection is already established, return it
    if (connection !== null) {
        if (connection.readyState === 1 || connection.readyState === 2) {
            console.log("Database already connected");
            return connection;
        }
    }

    try {
        // Connect to MongoDB using Mongoose
        connection = await mongoose.createConnection(mongodbUri, opts);
        /*connection = await mongoose
            .createConnection(mongodbUri, opts)
            .asPromise();*/

        // Log successful connection
        console.log("Database connected");
        connection.on("disconnected", async () => {
            console.log(
                `Lost connection to ${secureUri} so closing database connection as part of cleanup.`,
            );
            await this.disconnect();
        });

        // Return the database connection
        return connection;
    } catch (err) {
        console.error("Error connecting to database:", err);
        return err;
    }
};

/**
 * Middleware function for connecting to a MongoDB cluster.
 *
 * @param {Object} opts - Options for connecting to a MongoDB cluster.
 * @returns {Object} - Middleware object with 'before' function.
 */
const mongodbMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts };

    /**
     * Middleware function that handles the MongoDB connection before processing the request.
     *
     * @param {Object} request - The request object.
     * @returns {Promise} - A promise that resolves when the connection is established.
     */
    const mongodbMiddlewareBefore = async (request) => {
        if (!connection) {
            await connect(options);
        } else {
            if (connection.readyState === 1 || connection.readyState === 2) {
                console.log("Connection is cached");
            } else {
                await connect(options);
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

// Export the connect function for use in other modules
module.exports = {
    changeDatabase,
    disconnect,
    mongodbMiddleware,
};
