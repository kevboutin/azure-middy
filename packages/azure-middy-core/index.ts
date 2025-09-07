import {
    AzureFunctionRequest,
    MiddlewareFunction,
    Middleware,
    Plugin,
    MiddyInstance,
    BaseHandler,
    MiddyFunction,
} from "./typings";

import { HttpRequest, InvocationContext, HttpResponse } from '@azure/functions';

/**
 * Creates a middleware wrapper function.
 *
 * @param baseHandler - The base handler function.
 * @param plugin - The plugin object.
 * @returns The middleware wrapper function.
 */
const middy: MiddyFunction = (
    baseHandler: BaseHandler = async (_req?: HttpRequest, _context?: InvocationContext) => {
        return new HttpResponse({
            status: 200,
            headers: new Headers(),
        });
    },
    plugin?: Plugin,
) => {
    plugin?.beforePrefetch?.();
    const beforeMiddlewares: MiddlewareFunction[] = [];
    const afterMiddlewares: MiddlewareFunction[] = [];
    const onErrorMiddlewares: MiddlewareFunction[] = [];

    const instance: MiddyInstance = (req: any = {}, context: any = {}) => {
        plugin?.requestStart?.();
        const request: AzureFunctionRequest = {
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

    instance.use = (middlewares: Middleware | Middleware[]): MiddyInstance => {
        if (Array.isArray(middlewares)) {
            for (const middleware of middlewares) {
                instance.applyMiddleware(middleware);
            }
            return instance;
        }
        return instance.applyMiddleware(middlewares);
    };

    instance.applyMiddleware = (middleware: Middleware): MiddyInstance => {
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
    instance.before = (beforeMiddleware: MiddlewareFunction): MiddyInstance => {
        beforeMiddlewares.push(beforeMiddleware);
        return instance;
    };
    instance.after = (afterMiddleware: MiddlewareFunction): MiddyInstance => {
        afterMiddlewares.unshift(afterMiddleware);
        return instance;
    };
    instance.onError = (
        onErrorMiddleware: MiddlewareFunction,
    ): MiddyInstance => {
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
 * @param request - The request object.
 * @param beforeMiddlewares - The array of middlewares to run before the handler.
 * @param baseHandler - The base handler function.
 * @param afterMiddlewares - The array of middlewares to run after the handler.
 * @param onErrorMiddlewares - The array of middlewares to run when an error occurs.
 * @param plugin - The plugin object.
 * @returns A promise that resolves to the response of the request.
 */
const runRequest = async (
    request: AzureFunctionRequest,
    beforeMiddlewares: MiddlewareFunction[],
    baseHandler: BaseHandler,
    afterMiddlewares: MiddlewareFunction[],
    onErrorMiddlewares: MiddlewareFunction[],
    plugin?: Plugin,
): Promise<any> => {
    try {
        await runMiddlewares(request, beforeMiddlewares, plugin);
        // Check if before stack hasn't exit early
        if (request.response === undefined) {
            plugin?.beforeHandler?.();
            request.response = await baseHandler(request.req, request.context) as HttpResponse;
            plugin?.afterHandler?.();
            await runMiddlewares(request, afterMiddlewares, plugin);
        }
    } catch (e) {
        // Reset response changes made by after stack before error thrown
        request.response = undefined;
        request.error = e as Error;
        try {
            await runMiddlewares(request, onErrorMiddlewares, plugin);
            // Catch if onError stack hasn't handled the error
            if (request.response === undefined) throw request.error;
        } catch (e) {
            // Save error that wasn't handled
            (e as any).originalError = request.error;
            request.error = e as Error;
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
 * @param request - The request object.
 * @param middlewares - The array of middlewares to execute.
 * @param plugin - The plugin object.
 * @returns A promise that resolves to the response of the request.
 */
const runMiddlewares = async (
    request: AzureFunctionRequest,
    middlewares: MiddlewareFunction[],
    plugin?: Plugin,
): Promise<void> => {
    for (const nextMiddleware of middlewares) {
        plugin?.beforeMiddleware?.(nextMiddleware?.name);
        const res = await nextMiddleware?.(request);
        plugin?.afterMiddleware?.(nextMiddleware?.name);
        // short circuit chaining and respond early
        if (res !== undefined && res !== null && typeof res === 'object' && Object.keys(res).length > 0) {
            request.response = res as HttpResponse;
            return;
        }
    }
};

export default middy;
export { middy };
export type {
    AzureFunctionRequest,
    MiddlewareFunction,
    Middleware,
    Plugin,
    MiddyInstance,
    BaseHandler,
    MiddyFunction,
};
