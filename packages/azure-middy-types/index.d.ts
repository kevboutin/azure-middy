import type {
    HttpRequest,
    HttpResponse,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";

export type { HttpRequest, InvocationContext };

export interface AzureFunctionRequest extends HttpRequest {
    readonly req?: HttpRequest;
    readonly internal?: {
        connection?: Record<string, unknown>;
        [key: string]: unknown;
    };
    response?: HttpResponse | HttpResponseInit | undefined;
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
