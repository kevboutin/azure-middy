import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

export interface CacheOptions {
    readonly cacheKey: string;
    readonly cacheKeyExpiry?: Record<string, number>;
    readonly cacheExpiry?: number;
}

export interface CacheValue {
    value?: unknown;
    expiry?: number;
    modified?: boolean;
}

export interface ProcessCacheResult {
    value?: unknown;
    expiry?: number;
    cache?: boolean;
}

export type FetchFunction<T = AzureFunctionRequest, R = unknown> = (
    request: T,
    cachedValues?: unknown,
) => Promise<R> | R;

export interface InternalVariables {
    [key: string]: unknown;
}

export interface NormalizedHttpResponse {
    statusCode: number;
    body?: unknown;
    headers?: Record<string, string>;
}

export interface JsonSafeParseOptions {
    reviver?: (key: string, value: unknown) => unknown;
}

export interface JsonSafeStringifyOptions {
    replacer?: ((key: string, value: unknown) => unknown) | (string | number)[];
    space?: string | number;
}

// Function type definitions
export type JsonSafeParseFunction = (
    text: unknown,
    reviver?: JsonSafeParseOptions["reviver"],
) => unknown;

export type JsonSafeStringifyFunction = (
    value: unknown,
    replacer?: JsonSafeStringifyOptions["replacer"],
    space?: JsonSafeStringifyOptions["space"],
) => string | unknown;

export type ProcessCacheFunction = (
    request: AzureFunctionRequest,
    options: CacheOptions,
    fetch?: FetchFunction,
) => ProcessCacheResult;

export type GetCacheFunction = (key: string) => CacheValue;

export type ModifyCacheFunction = (cacheKey: string, value: unknown) => void;

export type ClearCacheFunction = (keys?: string[] | string | null) => void;

export type GetInternalFunction = (
    variables: boolean | string | string[] | Record<string, unknown>,
    request: AzureFunctionRequest,
) => Promise<InternalVariables>;

export type NormalizeHttpResponseFunction = (
    request: AzureFunctionRequest,
) => NormalizedHttpResponse;
