export interface AzureFunctionRequest {
    req: any;
    context: any;
    response?: any;
    error?: any;
    internal: Record<string, any>;
}

export interface MiddlewareFunction {
    (request: AzureFunctionRequest): Promise<any> | any;
}

export interface Middleware {
    before?: MiddlewareFunction;
    after?: MiddlewareFunction;
    onError?: MiddlewareFunction;
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

export interface MiddyInstance {
    (req?: any, context?: any): Promise<any>;
    use: (middlewares: Middleware | Middleware[]) => MiddyInstance;
    applyMiddleware: (middleware: Middleware) => MiddyInstance;
    before: (beforeMiddleware: MiddlewareFunction) => MiddyInstance;
    after: (afterMiddleware: MiddlewareFunction) => MiddyInstance;
    onError: (onErrorMiddleware: MiddlewareFunction) => MiddyInstance;
    __middlewares: {
        before: MiddlewareFunction[];
        after: MiddlewareFunction[];
        onError: MiddlewareFunction[];
    };
}

export type BaseHandler = (req?: any, context?: any) => Promise<any> | any;

export type MiddyFunction = (
    baseHandler?: BaseHandler,
    plugin?: Plugin,
) => MiddyInstance;
