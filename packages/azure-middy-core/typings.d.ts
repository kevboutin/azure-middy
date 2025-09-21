import { HttpRequest, InvocationContext, HttpResponse } from "@azure/functions";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

export type MiddlewareFunction<T = AzureFunctionRequest, R = unknown> = (
    request: T,
) => Promise<R> | R;

export interface Middleware<T = AzureFunctionRequest, R = unknown> {
    before?: MiddlewareFunction<T, R>;
    after?: MiddlewareFunction<T, R>;
    onError?: MiddlewareFunction<T, R>;
}

export interface Plugin {
    beforePrefetch?: () => void;
    requestStart?: () => void;
    beforeHandler?: () => void;
    afterHandler?: () => void;
    requestEnd?: () => void;
    beforeMiddleware?: (middlewareName?: string) => void;
    afterMiddleware?: (middlewareName?: string) => void;
}

export interface MiddyInstance<T = AzureFunctionRequest, R = unknown> {
    (req?: unknown, context?: unknown): Promise<R>;
    use: (
        middlewares: Middleware<T, R> | Middleware<T, R>[],
    ) => MiddyInstance<T, R>;
    applyMiddleware: (middleware: Middleware<T, R>) => MiddyInstance<T, R>;
    before: (beforeMiddleware: MiddlewareFunction<T, R>) => MiddyInstance<T, R>;
    after: (afterMiddleware: MiddlewareFunction<T, R>) => MiddyInstance<T, R>;
    onError: (
        onErrorMiddleware: MiddlewareFunction<T, R>,
    ) => MiddyInstance<T, R>;
    __middlewares: {
        before: MiddlewareFunction<T, R>[];
        after: MiddlewareFunction<T, R>[];
        onError: MiddlewareFunction<T, R>[];
    };
}

export type BaseHandler<
    T = HttpRequest,
    C = InvocationContext,
    R = HttpResponse,
> = (req?: T, context?: C) => Promise<R> | R;

export type MiddyFunction<T = AzureFunctionRequest, R = unknown> = (
    baseHandler?: BaseHandler,
    plugin?: Plugin,
) => MiddyInstance<T, R>;
