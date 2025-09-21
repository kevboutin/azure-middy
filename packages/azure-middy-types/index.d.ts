import type { HttpRequest, InvocationContext } from "@azure/functions";

export type { HttpRequest, InvocationContext };

export interface AzureFunctionRequest extends HttpRequest {
    readonly req?: HttpRequest;
    readonly internal?: {
        readonly connection?: Record<string, unknown>;
    };
    response?: {
        readonly headers: Record<string, string>;
        [key: string]: unknown;
    };
    context?: AzureFunctionContext;
    error?: Error | undefined;
    [key: string]: unknown;
}

export interface AzureFunctionContext extends InvocationContext {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
    [key: string]: any;
}
