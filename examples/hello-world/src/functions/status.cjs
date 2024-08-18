/**
 * Status module that is a simple example using the Azure functions v4 programming model without any middleware.
 *
 * @module status
 * @see module:status
 * @author Kevin Boutin <kevboutin@gmail.com>
 */
const { app, HttpRequest, InvocationContext } = require("@azure/functions");

/** @constant {Object<string, string>} */
const headers = {
    "Content-Type": "application/json",
};

/**
 * All responses use this format.
 *
 * @typedef {Object} Response
 * @property {string} body The body of the response, which is stringified JSON.
 * @property {Object<string, string>} headers Key-value pairs used as the HTTP response headers.
 * @property {number} status The HTTP response status code.
 */

/**
 * Show environment.
 *
 * @param {HttpRequest} request The request.
 * @param {InvocationContext} context The context.
 * @returns {Response} The response.
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
