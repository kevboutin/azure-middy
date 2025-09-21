// @ts-ignore
import intercept from "azure-function-log-intercept";
import { LoggerMiddleware } from "./typings";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

/**
 * Middleware function for logging.
 *
 * This function intercepts the request context and logs it using the azure-function-log-intercept library.
 *
 * @returns An object containing the 'before' property, which is a function that intercepts the request context.
 */
const loggerMiddleware = (): LoggerMiddleware => {
    const loggerMiddlewareBefore = async (
        request: AzureFunctionRequest,
    ): Promise<void> => {
        if (request.context) {
            intercept(request.context);
        }
    };

    return {
        before: loggerMiddlewareBefore,
    };
};

export default loggerMiddleware;
export { loggerMiddleware };
export type { LoggerMiddleware };
