export interface AzureFunctionContext {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
    verbose: (...args: any[]) => void;
    [key: string]: any;
}

export interface AzureFunctionRequest {
    context?: AzureFunctionContext;
    [key: string]: unknown;
}

export interface LoggerMiddleware {
    before: (request: AzureFunctionRequest) => Promise<void>;
}

export type LoggerMiddlewareFunction = () => LoggerMiddleware;

// Declare module for dependencies
declare module "azure-function-log-intercept" {
    export function intercept(context: AzureFunctionContext): void;
}
