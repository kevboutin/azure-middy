const intercept = require("azure-function-log-intercept");

/**
 * Middleware function for logging.
 *
 * This function intercepts the request context and logs it using the azure-function-log-intercept library.
 *
 * @returns {Object} - An object containing the 'before' property, which is a function that intercepts the request context.
 */
const loggerMiddleware = () => {
    const loggerMiddlewareBefore = async (request) => {
        intercept(request.context);
    };

    return {
        before: loggerMiddlewareBefore,
    };
};

module.exports = {
    loggerMiddleware,
};
