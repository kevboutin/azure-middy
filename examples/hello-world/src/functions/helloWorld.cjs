/**
 * Hello world module that is a simple example using the Azure functions v4 programming model.
 *
 * Examples:
 * curl http://localhost:7070/api/hello?name=Kevin
 * curl -X POST http://localhost:7070/api/hello --json '{"name" : "Boutin"}'
 *
 * Output from GET:
 * [2024-08-18T18:46:50.500Z] Executing 'Functions.helloWorld' (Reason='This function was programmatically called via the host APIs.', Id=8de844d8-fbf2-4e04-b1e4-14b9f4387ea1)
 * [2024-08-18T18:46:50.532Z] hello-world: Function helloWorld has been called with GET to http://localhost:7070/api/hello?name=Kevin
 * [2024-08-18T18:46:50.532Z] hello-world: requestBody=
 * [2024-08-18T18:46:50.532Z] hello-world: Hello world! This is from Kevin.
 * [2024-08-18T18:46:50.560Z] Executed 'Functions.helloWorld' (Succeeded, Id=8de844d8-fbf2-4e04-b1e4-14b9f4387ea1, Duration=70ms)
 *
 * Output from POST:
 * [2024-08-18T18:54:26.874Z] Executing 'Functions.helloWorld' (Reason='This function was programmatically called via the host APIs.', Id=190bf25a-e657-4c9b-9deb-0879ec881aa9)
 * [2024-08-18T18:54:26.906Z] hello-world: Function helloWorld has been called with POST to http://localhost:7070/api/hello
 * [2024-08-18T18:54:26.906Z] hello-world: requestBody={"name":"Boutin"}
 * [2024-08-18T18:54:26.906Z] hello-world: Hello world! This is from Boutin.
 * [2024-08-18T18:54:26.929Z] Executed 'Functions.helloWorld' (Succeeded, Id=190bf25a-e657-4c9b-9deb-0879ec881aa9, Duration=67ms)
 *
 * @module helloWorld
 * @see module:helloWorld
 * @author Kevin Boutin <kevboutin@gmail.com>
 */
const { app, HttpRequest, InvocationContext } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const loggerMiddleware = require("@kevboutin/azure-middy-logger");

/** @constant {string} */
const TAG = "hello-world";
/** @constant {Object<string, string>} */
const headers = {
    "Content-Type": "application/json",
};

/**
 * All responses use this format.
 *
 * @typedef {Object} Response
 * @property {Object<string, string>} headers Key-value pairs used as the HTTP response headers.
 * @property {Object} jsonBody The body of the response, which is JSON.
 * @property {number} status The HTTP response status code.
 */

/**
 * Handles a request and generates an appropriate response.
 *
 * @param {HttpRequest} req The request object containing information about the incoming request.
 * @param {InvocationContext} context The context object containing information about the current execution context.
 * @returns {Response} The response.
 */
const baseHandler = async (req, context) => {
    console.log(
        `${TAG}: Function ${context.functionName} has been called with ${req.method} to ${req.url}`,
    );
    let queryParams = {};
    // Azure v4 functions need to use the following to get the body.
    let requestBody = JSON.parse(await req.text());
    console.log(`${TAG}: requestBody=${JSON.stringify(requestBody)}`);
    // Azure v4 functions use URLSearchParams for query parameters.
    if (req.query instanceof URLSearchParams) {
        queryParams = Object.fromEntries(req.query.entries());
    }
    // Query parameters are used if using a GET request; alternatively, the request body is used for a POST request.
    if (queryParams.name || requestBody.name) {
        const name = queryParams.name || requestBody.name;
        const msg = `Hello world! This is from ${name}.`;
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
        body: JSON.stringify({
            result: "failure",
            message:
                "Please provide a name as a query parameter as a get or in the body of the request as a post.",
        }),
    };
};

/** @constant {Function} */
const helloWorld = middy(baseHandler).use(loggerMiddleware());

module.exports = helloWorld;

app.http("helloWorld", {
    route: "hello",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: helloWorld,
});
