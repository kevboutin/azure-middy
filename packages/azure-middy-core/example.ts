// Example TypeScript usage of the core middleware engine
import middy, {
    MiddyInstance,
    Middleware,
    Plugin,
    AzureFunctionRequest,
} from "./index";

// Example handler with proper TypeScript types
const baseHandler = async (req: any, context: any) => {
    console.log("Processing request:", req.method, req.url);

    return {
        body: JSON.stringify({ message: "Success" }),
        headers: {
            "Content-Type": "application/json",
        },
    };
};

// Example middleware with TypeScript
const loggingMiddleware: Middleware = {
    before: async (request: AzureFunctionRequest) => {
        console.log(
            "Before handler - Request:",
            request.req.method,
            request.req.url,
        );
    },
    after: async (request: AzureFunctionRequest) => {
        console.log(
            "After handler - Response status:",
            request.response?.statusCode,
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
const handler: MiddyInstance = middy(baseHandler, monitoringPlugin);

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
