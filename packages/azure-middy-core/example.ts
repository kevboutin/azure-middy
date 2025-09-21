// Example TypeScript usage of the core middleware engine
import middy, { MiddyInstance, Middleware, Plugin, BaseHandler } from "./index";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

import { HttpRequest, InvocationContext } from "@azure/functions";

// Example handler with proper TypeScript types
const baseHandler = async (
    req: HttpRequest | undefined,
    context: InvocationContext,
): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
}> => {
    if (!req) {
        throw new Error("Request object is undefined");
    }
    console.log("Processing request:", req.method, req.url);
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ message: "Success" });
    // Return a plain object with status, headers, and body
    return {
        status: 200,
        headers,
        body,
    };
};

// Example middleware with TypeScript
const loggingMiddleware: Middleware = {
    before: async (request: AzureFunctionRequest) => {
        console.log(
            "Before handler - Request:",
            request?.req?.method,
            request?.req?.url,
        );
    },
    after: async (request: AzureFunctionRequest) => {
        console.log(
            "After handler - Response status:",
            request.response?.status,
        );
    },
    onError: async (request: AzureFunctionRequest) => {
        console.error("Error occurred:", request.error);
    },
};

// Example plugin with TypeScript
const monitoringPlugin: Plugin = {
    requestStart: () => {
        console.log("Request started");
    },
    beforeHandler: () => {
        console.log("About to execute handler");
    },
    afterHandler: () => {
        console.log("Handler executed");
    },
    requestEnd: () => {
        console.log("Request ended");
    },
    beforeMiddleware: (middlewareName?: string) => {
        console.log("Before middleware:", middlewareName);
    },
    afterMiddleware: (middlewareName?: string) => {
        console.log("After middleware:", middlewareName);
    },
};

// Create middleware instance with TypeScript
const handler: MiddyInstance<AzureFunctionRequest, unknown> = middy(
    baseHandler as unknown as BaseHandler,
    monitoringPlugin,
);

// Apply middleware
handler.use(loggingMiddleware);

// Example of using the handler
const exampleRequest = {
    method: "GET",
    url: "/api/example",
    headers: {
        "Content-Type": "application/json",
    },
};

const exampleContext = {
    log: (...args: any[]) => console.log(...args),
};

// This would typically be called by Azure Functions
// const result = await handler(exampleRequest, exampleContext);

console.log("TypeScript example loaded successfully");
