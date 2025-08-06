import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

export interface KeyVaultSecretsOptions {
    cacheKey?: string;
    fetchData: Record<string, string>;
    vaultUrl: string;
}

export interface AzureFunctionRequest {
    internal?: {
        [key: string]: any;
    };
    [key: string]: any;
}

export interface CachedValues {
    [key: string]: any;
}

export interface FetchedValues {
    [key: string]: any;
}

export interface KeyVaultSecretsMiddleware {
    before: (request: AzureFunctionRequest) => Promise<void>;
}

export type KeyVaultSecretsMiddlewareFunction = (
    opts?: KeyVaultSecretsOptions,
) => KeyVaultSecretsMiddleware;

export interface FetchFunction {
    (
        request: AzureFunctionRequest,
        cachedValues?: CachedValues,
    ): Promise<FetchedValues>;
}

// Declare module for dependencies
declare module "@kevboutin/azure-middy-util" {
    export function getCache(cacheKey: string): { value: any };
    export function getInternal(
        keys: string[],
        request: AzureFunctionRequest,
    ): Promise<void>;
    export function modifyCache(cacheKey: string, value: any): void;
    export function processCache(
        request: AzureFunctionRequest,
        options: KeyVaultSecretsOptions,
        fetch: FetchFunction,
    ): { value: Promise<FetchedValues> | null };
    export function jsonSafeParse(value: any): any;
}
