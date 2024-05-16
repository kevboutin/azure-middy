const memwatch = require("@airbnb/node-memwatch");

const defaults = {
    logger: console.log,
    enabled: true,
};

/**
 * A plugin for monitoring memory usage during request processing.
 *
 * @param {Object} opts - Options for configuring the plugin.
 * @param {Function} opts.logger - The logger function to use for logging memory usage.
 * @param {boolean} opts.enabled - Whether the plugin is enabled or not.
 * @returns {Object} - An object containing the plugin's methods.
 */
const memoryPlugin = (opts = {}) => {
    const { logger, enabled } = { ...defaults, ...opts };
    if (!enabled) {
        return {};
    }

    let cold = true;
    const store = {};

    const start = (id) => {
        store[id] = new memwatch.HeapDiff();
    };
    const stop = (id) => {
        logger(id, store[id].end());
    };

    const beforePrefetch = () => start("prefetch");
    const requestStart = () => {
        if (cold) {
            cold = false;
            stop("prefetch");
        }
        start("request");
    };
    const beforeMiddleware = start;
    const afterMiddleware = stop;
    const beforeHandler = () => start("handler");
    const afterHandler = () => stop("handler");
    const requestEnd = () => stop("request");

    return {
        beforePrefetch,
        requestStart,
        beforeMiddleware,
        afterMiddleware,
        beforeHandler,
        afterHandler,
        requestEnd,
    };
};

module.exports = { memoryPlugin };
