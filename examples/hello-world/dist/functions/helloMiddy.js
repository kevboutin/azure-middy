"use strict";
var __importDefault =
    (this && this.__importDefault) ||
    function (mod) {
        return mod && mod.__esModule ? mod : { default: mod };
    };
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Hello middy module that is a simple example using the Azure functions v4 programming model.
 *
 * @module helloMiddy
 * @see module:helloMiddy
 * @author Kevin Boutin <kevboutin@gmail.com>
 */
const functions_1 = require("@azure/functions");
const azure_middy_core_1 = __importDefault(
    require("@kevboutin/azure-middy-core"),
);
const azure_middy_logger_1 = __importDefault(
    require("@kevboutin/azure-middy-logger"),
);
const TAG = "hello-middy";
const headers = new Headers({
    "Content-Type": "application/json",
});
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
            jsonBody: {
                result: "failure",
                message: "Request object is missing.",
            },
        };
    }
    console.log(
        `${TAG}: Function ${context.functionName} has been called with ${req.method} to ${req.url}`,
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
    // Azure v4 functions use URLSearchParams for query parameters.
    if (req.query instanceof URLSearchParams) {
        queryParams = Object.fromEntries(req.query.entries());
    }
    // Query parameters are used if using a GET request; alternatively, the request body is used for a POST request.
    if (queryParams.name || requestBody.name) {
        const name = queryParams.name || requestBody.name;
        const msg = `Hello middy! This is from ${name}.`;
        console.log(`${TAG}: ${msg}`);
        return {
            status: 200,
            headers,
            jsonBody: {
                result: "success",
                message: msg,
            },
        };
    }
    console.error(
        `${TAG}: Name attribute was not provided in the query or body.`,
    );
    return {
        status: 400,
        headers,
        jsonBody: {
            result: "failure",
            message:
                "Please provide a name as a query parameter as a get or in the body of the request as a post.",
        },
    };
};
const helloMiddy = (0, azure_middy_core_1.default)(baseHandler).use(
    (0, azure_middy_logger_1.default)(),
);
module.exports = helloMiddy;
functions_1.app.http("helloMiddy", {
    route: "middy",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: helloMiddy,
});
