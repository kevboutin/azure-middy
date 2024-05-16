const defaults = {
    logger: console.log,
    enabled: true,
};

/**
 * A plugin for measuring the execution time of different stages in a request lifecycle.
 *
 * @param {Object} opts - Options for configuring the plugin.
 * @param {Function} opts.logger - The logger function to use for logging the execution time. Default is console.log.
 * @param {boolean} opts.enabled - Whether the plugin is enabled or not. Default is true.
 * @returns {Object} - An object containing the plugin functions.
 */
const timePlugin = (opts = {}) => {
    const { logger, enabled } = { ...defaults, ...opts };
    if (!enabled) {
        return {};
    }

    let cold = true;
    const store = {};

    const start = (id) => {
        store[id] = process.hrtime.bigint();
    };
    const stop = (id) => {
        if (!enabled) return;
        logger(
            id,
            Number.parseInt((process.hrtime.bigint() - store[id]).toString()) /
                1_000_000,
            "ms",
        );
    };

    // Only run during cold start
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

module.exports = { timePlugin };
