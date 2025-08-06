export interface CacheOptions {
    cacheKey: string;
    cacheKeyExpiry?: Record<string, number>;
    cacheExpiry?: number;
}

export interface CacheValue {
    value?: any;
    expiry?: number;
    modified?: boolean;
}

export interface ProcessCacheResult {
    value?: any;
    expiry?: number;
    cache?: boolean;
}

export interface AzureFunctionRequest {
    internal: Record<string, any>;
    [key: string]: any;
}

export interface FetchFunction {
    (request: AzureFunctionRequest, cachedValues?: any): Promise<any> | any;
}

export interface InternalVariables {
    [key: string]: any;
}

export interface NormalizedHttpResponse {
    statusCode: number;
    body?: any;
    headers?: Record<string, string>;
}

export interface JsonSafeParseOptions {
    reviver?: (key: string, value: any) => any;
}

export interface JsonSafeStringifyOptions {
    replacer?: ((key: string, value: any) => any) | (string | number)[];
    space?: string | number;
}

// Function type definitions
export type JsonSafeParseFunction = (
    text: any,
    reviver?: JsonSafeParseOptions["reviver"],
) => any;

export type JsonSafeStringifyFunction = (
    value: any,
    replacer?: JsonSafeStringifyOptions["replacer"],
    space?: JsonSafeStringifyOptions["space"],
) => string | any;

export type ProcessCacheFunction = (
    request: AzureFunctionRequest,
    options: CacheOptions,
    fetch?: FetchFunction,
) => ProcessCacheResult;

export type GetCacheFunction = (key: string) => CacheValue;

export type ModifyCacheFunction = (cacheKey: string, value: any) => void;

export type ClearCacheFunction = (keys?: string[] | string | null) => void;

export type GetInternalFunction = (
    variables: boolean | string | string[] | Record<string, any>,
    request: AzureFunctionRequest,
) => Promise<InternalVariables>;

export type NormalizeHttpResponseFunction = (
    request: AzureFunctionRequest,
) => NormalizedHttpResponse;
