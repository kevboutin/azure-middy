/**
 * Creates a middleware wrapper function.
 *
 * @param {Function} baseHandler - The base handler function.
 * @param {Object} plugin - The plugin object.
 * @returns {Function} - The middleware wrapper function.
 */
const middy = (baseHandler = () => {}, plugin) => {
    plugin?.beforePrefetch?.();
    const beforeMiddlewares = [];
    const afterMiddlewares = [];
    const onErrorMiddlewares = [];

    const instance = (req = {}, context = {}) => {
        plugin?.requestStart?.();
        const request = {
            req,
            context,
            response: undefined,
            error: undefined,
            internal: {},
        };

        return runRequest(
            request,
            [...beforeMiddlewares],
            baseHandler,
            [...afterMiddlewares],
            [...onErrorMiddlewares],
            plugin,
        );
    };

    instance.use = (middlewares) => {
        if (Array.isArray(middlewares)) {
            for (const middleware of middlewares) {
                instance.applyMiddleware(middleware);
            }
            return instance;
        }
        return instance.applyMiddleware(middlewares);
    };

    instance.applyMiddleware = (middleware) => {
        const { before, after, onError } = middleware;

        if (!before && !after && !onError) {
            throw new Error(
                'Middleware must be an object containing at least one key among "before", "after", "onError"',
            );
        }

        if (before) instance.before(before);
        if (after) instance.after(after);
        if (onError) instance.onError(onError);

        return instance;
    };

    // Inline Middlewares
    instance.before = (beforeMiddleware) => {
        beforeMiddlewares.push(beforeMiddleware);
        return instance;
    };
    instance.after = (afterMiddleware) => {
        afterMiddlewares.unshift(afterMiddleware);
        return instance;
    };
    instance.onError = (onErrorMiddleware) => {
        onErrorMiddlewares.push(onErrorMiddleware);
        return instance;
    };

    instance.__middlewares = {
        before: beforeMiddlewares,
        after: afterMiddlewares,
        onError: onErrorMiddlewares,
    };

    return instance;
};

/**
 * Executes a request by running the provided middlewares and handler.
 *
 * @param {Object} request - The request object.
 * @param {Array} beforeMiddlewares - The array of middlewares to run before the handler.
 * @param {Function} baseHandler - The base handler function.
 * @param {Array} afterMiddlewares - The array of middlewares to run after the handler.
 * @param {Array} onErrorMiddlewares - The array of middlewares to run when an error occurs.
 * @param {Object} plugin - The plugin object.
 * @returns {Promise} - A promise that resolves to the response of the request.
 */
const runRequest = async (
    request,
    beforeMiddlewares,
    baseHandler,
    afterMiddlewares,
    onErrorMiddlewares,
    plugin,
) => {
    try {
        await runMiddlewares(request, beforeMiddlewares, plugin);
        // Check if before stack hasn't exit early
        if (request.response === undefined) {
            plugin?.beforeHandler?.();
            request.response = await baseHandler(request.req, request.context);
            plugin?.afterHandler?.();
            await runMiddlewares(request, afterMiddlewares, plugin);
        }
    } catch (e) {
        // Reset response changes made by after stack before error thrown
        request.response = undefined;
        request.error = e;
        try {
            await runMiddlewares(request, onErrorMiddlewares, plugin);
            // Catch if onError stack hasn't handled the error
            if (request.response === undefined) throw request.error;
        } catch (e) {
            // Save error that wasn't handled
            e.originalError = request.error;
            request.error = e;
            throw request.error;
        }
    } finally {
        await plugin?.requestEnd?.();
    }
    return request.response;
};

/**
 * Executes the provided middlewares for a given request.
 *
 * @param {Object} request - The request object.
 * @param {Array} middlewares - The array of middlewares to execute.
 * @param {Object} plugin - The plugin object.
 * @returns {Promise} - A promise that resolves to the response of the request.
 */
const runMiddlewares = async (request, middlewares, plugin) => {
    for (const nextMiddleware of middlewares) {
        plugin?.beforeMiddleware?.(nextMiddleware?.name);
        const res = await nextMiddleware?.(request);
        plugin?.afterMiddleware?.(nextMiddleware?.name);
        // short circuit chaining and respond early
        if (res !== undefined) {
            request.response = res;
            return;
        }
    }
};

module.exports = middy;
