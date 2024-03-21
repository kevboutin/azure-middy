const intercept = require("azure-function-log-intercept");

const loggerMiddleware = () => {
    const loggerMiddlewareBefore = async (request) => {
        intercept(request.context);
    };

    return {
        before: loggerMiddlewareBefore,
    };
};

// Export the connect function for use in other modules
module.exports = {
    loggerMiddleware,
};
