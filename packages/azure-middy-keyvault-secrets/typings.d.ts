import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

export interface KeyVaultSecretsOptions {
    readonly cacheKey?: string;
    readonly fetchData: Record<string, string>;
    readonly vaultUrl: string;
}

export interface CachedValues {
    [key: string]: unknown;
}

export interface FetchedValues {
    [key: string]: unknown;
}

export interface KeyVaultSecretsMiddleware {
    before: (request: AzureFunctionRequest) => Promise<void>;
}

export type KeyVaultSecretsMiddlewareFunction = (
    opts?: Partial<KeyVaultSecretsOptions>,
) => KeyVaultSecretsMiddleware;

export type FetchFunction = (
    request: AzureFunctionRequest,
    cachedValues?: CachedValues,
) => Promise<FetchedValues>;

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
