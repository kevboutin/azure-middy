import type {
    AzureFunctionRequest,
    AzureFunctionContext,
} from "@kevboutin/azure-middy-types";

export interface LoggerMiddleware {
    before: (request: AzureFunctionRequest) => Promise<void>;
}

export type LoggerMiddlewareFunction = () => LoggerMiddleware;

// Declare module for dependencies
declare module "azure-function-log-intercept" {
    export function intercept(context: AzureFunctionContext): void;
}
