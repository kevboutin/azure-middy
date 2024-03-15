const mongoose = require("mongoose");

let connection = null;
const mongodbUri = process.env.MONGO_URI || "mongodb://localhost:27017";
const defaults = {
    serverSelectionTimeoutMS: 5000,
};

// Provide a new connection to a specific database
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

// Disconnect from the database
const disconnect = async () => {
    console.log("Disconnecting from MongoDB");
    try {
        if (connection) {
            await connection.disconnect();
            connection = null;
        }
    } catch (err) {
        console.error("Error disconnecting from the database:", err);
        return err;
    }
};

// Connect to the database
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

        // Return the database connection
        return connection;
    } catch (err) {
        console.error("Error connecting to database:", err);
        return err;
    }
};

const mongodbMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts };

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
