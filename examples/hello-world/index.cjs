/*
 * Simple "hello world" example using the Azure functions v3 programming model.
 */
const middy = require("@kevboutin/azure-middy-core");
const loggerMiddleware = require("@kevboutin/azure-middy-logger");

const TAG = "hello-world";
const headers = {
    "Content-Type": "application/json",
};
let msg = "Hello world!";

const baseHandler = async (context, req) => {
    if (req.query.name || (req.body && req.body.name)) {
        const name = req.query.name || req.body.name;
        msg = `Hello world! This is from ${name}.`;
        console.log(`${TAG}: ${msg}`);
        context.res = {
            headers,
            status: 200,
            body: {
                result: "success",
                message: msg,
            },
        };
        return;
    }

    console.error(
        `${TAG}: Name attribute was not provided in the query or body.`,
    );
    context.res = {
        headers,
        status: 400,
        body: {
            result: "failure",
            message:
                "Please provide a name as a query parameter or in the body of the request.",
        },
    };
    return;
};

const handler = middy(baseHandler).use(loggerMiddleware());

module.exports = { handler };
