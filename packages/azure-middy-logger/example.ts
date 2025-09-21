// Example TypeScript usage of the logger middleware
import { loggerMiddleware } from "./index";
import {
    AzureFunctionRequest,
    AzureFunctionContext,
} from "@kevboutin/azure-middy-types";

// Example handler with proper TypeScript types
const baseHandler = async (
    req: AzureFunctionRequest,
    context: AzureFunctionContext,
) => {
    // The logger middleware will automatically intercept the context
    // and provide enhanced logging capabilities

    context.log("Processing request with enhanced logging");
    context.info("Request details:", {
        method: req["method"],
        url: req["url"],
        headers: req["headers"],
    });

    return {
        body: JSON.stringify({ message: "Success" }),
        headers: {
            "Content-Type": "application/json",
        },
    };
};

// Create middleware instance
const logger = loggerMiddleware();

// Example of using the middleware
const exampleRequest: AzureFunctionRequest = {
    context: {
        log: (...args: any[]) => console.log(...args),
        error: (...args: any[]) => console.error(...args),
        warn: (...args: any[]) => console.warn(...args),
        info: (...args: any[]) => console.info(...args),
    },
    method: "GET",
    url: "/api/example",
    headers: {
        "Content-Type": "application/json",
    },
};

// This would typically be called by the middleware engine
// await logger.before(exampleRequest);

console.log("TypeScript example loaded successfully");
