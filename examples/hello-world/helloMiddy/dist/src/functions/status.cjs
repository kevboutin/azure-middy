/**
 * Status module that is a simple example using the Azure functions v4 programming model without any middleware.
 *
 * @module status
 * @see module:status
 * @author Kevin Boutin <kevboutin@gmail.com>
 */
const {
    app,
    HttpRequest,
    HttpResponse,
    InvocationContext,
} = require("@azure/functions");

/** @constant {Object<string, string>} */
const headers = {
    "Content-Type": "application/json",
};

/**
 * Show environment.
 *
 * @param {HttpRequest} request The request.
 * @param {InvocationContext} context The context.
 * @returns {HttpResponse} The response.
 */
const status = async (request, context) => {
    context.log(
        `Http function (${context.functionName}) processed request for url "${request.url}"`,
    );

    return {
        status: 200,
        headers,
        jsonBody: {
            env: process.env,
        },
    };
};

app.http("status", {
    route: "status",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: status,
});

module.exports = status;
