// Example TypeScript usage of the MongoDB middleware
import {
    mongodbMiddleware,
    MongoDBMiddlewareOptions,
    AzureFunctionRequest,
} from "./index";

// Example handler with proper TypeScript types
const baseHandler = async (req: AzureFunctionRequest, context: any) => {
    // Access the MongoDB connection from the request
    const connection = req.internal?.connection;

    if (connection) {
        console.log("MongoDB connection available:", connection["name"]);
    }

    return {
        body: JSON.stringify({
            message: "Success",
            hasConnection: !!connection,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    };
};

// Configure middleware options with TypeScript
const middlewareOptions: MongoDBMiddlewareOptions = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 1,
};

// Create middleware instance
const mongoMiddleware = mongodbMiddleware(middlewareOptions);

// Example of using the middleware
const exampleRequest: AzureFunctionRequest = {
    internal: {},
    // ... other request properties
};

// This would typically be called by the middleware engine
// mongoMiddleware.before(exampleRequest);

console.log("TypeScript example loaded successfully");
