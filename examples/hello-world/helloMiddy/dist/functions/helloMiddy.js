"use strict";
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloMiddy = void 0;
const azure_middy_core_1 = __importDefault(
    require("@kevboutin/azure-middy-core"),
);
const azure_middy_logger_1 = __importDefault(
    require("@kevboutin/azure-middy-logger"),
);
const TAG = "hello-middy";
const headers = {
    "Content-Type": "application/json",
};
/**
 * Handles a request and generates an appropriate response.
 *
 * @param {HttpRequest} req The request object containing information about the incoming request.
 * @param {InvocationContext} context The context object containing information about the current execution context.
 * @returns {HttpResponseInit} The response.
 */
const baseHandler = async (req, context) => {
    if (!req) {
        console.error(`${TAG}: Request object is undefined.`);
        return {
            status: 400,
            headers,
            body: JSON.stringify({
                result: "failure",
                message: "Request object is missing.",
            }),
        };
    }
    console.log(
        `${TAG}: Function ${context?.functionName ?? "helloMiddy"} has been called with ${req.method} to ${req.url}`,
    );
    let queryParams = {};
    // Azure v4 functions need to use the following to get the body.
    let requestBody = {};
    try {
        requestBody = await req.json();
    } catch (e) {
        requestBody = {};
    }
    console.log(`${TAG}: requestBody=${JSON.stringify(requestBody)}`);
    // Azure v4 functions may expose query as URLSearchParams or plain object depending on host/runtime.
    if (req.query instanceof URLSearchParams) {
        queryParams = Object.fromEntries(req.query.entries());
    } else if (req.query && typeof req.query === "object") {
        queryParams = Object.fromEntries(
            Object.entries(req.query).map(([k, v]) => [k, String(v)]),
        );
    } else {
        // Fall back by parsing URL directly in case query was unexpected shape.
        try {
            queryParams = Object.fromEntries(
                new URL(req.url).searchParams.entries(),
            );
        } catch (_e) {
            queryParams = {};
        }
    }
    // Query parameters are used if using a GET request; alternatively, the request body is used for a POST request.
    if (queryParams.name || requestBody.name) {
        const name = queryParams.name || requestBody.name;
        const msg = `Hello middy! This is from ${name}.`;
        console.log(`${TAG}: ${msg}`);
        return {
            status: 200,
            headers,
            body: JSON.stringify({
                result: "success",
                message: msg,
            }),
        };
    }
    console.error(
        `${TAG}: Name attribute was not provided in the query or body.`,
    );
    return {
        status: 400,
        headers,
        body: JSON.stringify({
            result: "failure",
            message:
                "Please provide a name as a query parameter as a get or in the body of the request as a post.",
        }),
    };
};
const middyHandler = (0, azure_middy_core_1.default)(baseHandler).use(
    (0, azure_middy_logger_1.default)(),
);
const isHttpRequest = (value) => {
    return (
        value &&
        typeof value.method === "string" &&
        typeof value.url === "string"
    );
};
const helloMiddy = async (firstArg, secondArg) => {
    // Accept both v4 app model (req, context) and classic context-first host invocation
    let req;
    let context;
    if (isHttpRequest(firstArg)) {
        req = firstArg;
        context = secondArg;
    } else if (isHttpRequest(secondArg)) {
        req = secondArg;
        context = firstArg;
    } else {
        context = firstArg ?? secondArg;
    }
    const response = await middyHandler(req, context);
    // For bindings-based function model (function.json), context.res is expected.
    if (context && typeof context === "object") {
        context.res = response;
    }
    return response;
};
exports.helloMiddy = helloMiddy;
