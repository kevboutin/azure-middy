/*
 * Simple "hello world" example using the Azure functions v3 programming model.
 */
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const loggerMiddleware = require("@kevboutin/azure-middy-logger");

const TAG = "hello-world";
const headers = {
    "Content-Type": "application/json",
};

/**
 * Handles a request and generates an appropriate response.
 *
 * @param {Object} req The request object containing information about the incoming request.
 * @param {Object} context The context object containing information about the current execution context.
 * @returns {void}
 */
const baseHandler = async (req, context) => {
    let queryParams = {};
    // Azure v4 functions need to use the following to get the body.
    let requestBody = await new Response(req.body).json();
    // Azure v4 functions use URLSearchParams.
    if (req.query instanceof URLSearchParams) {
        queryParams = Object.fromEntries(req.query.entries());
    }
    if (queryParams.name || requestBody.name) {
        const name = queryParams.name || requestBody.name;
        const msg = `Hello world! This is from ${name}.`;
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
                "Please provide a name as a query parameter or in the body of the request.",
        }),
    };
};

const handler = middy(baseHandler).use(loggerMiddleware());

module.exports = { handler };

app.http("hello-world", {
    route: "hello",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
