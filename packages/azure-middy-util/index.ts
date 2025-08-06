import {
    CacheOptions,
    CacheValue,
    ProcessCacheResult,
    AzureFunctionRequest,
    FetchFunction,
    InternalVariables,
    NormalizedHttpResponse,
    JsonSafeParseFunction,
    JsonSafeStringifyFunction,
    ProcessCacheFunction,
    GetCacheFunction,
    ModifyCacheFunction,
    ClearCacheFunction,
    GetInternalFunction,
    NormalizeHttpResponseFunction,
} from "./typings";

/**
 * Safely parses a JSON string into a JavaScript value.
 *
 * @param text - The JSON string to be parsed.
 * @param reviver - A function that transforms the parsed value before returning it.
 * @returns The parsed JavaScript value, or the original text if parsing fails.
 */
const jsonSafeParse: JsonSafeParseFunction = (
    text: any,
    reviver?: (key: string, value: any) => any,
): any => {
    if (typeof text !== "string") return text;
    const firstChar = text[0];
    if (firstChar !== "{" && firstChar !== "[" && firstChar !== '"')
        return text;
    try {
        return JSON.parse(text, reviver);
    } catch (e) {}

    return text;
};

/**
 * Safely converts a JavaScript value to a JSON string.
 *
 * @param value - The value to be converted to a JSON string.
 * @param replacer - A function that alters the behavior of the stringification process, or an array of strings and numbers that acts as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string.
 * @param space - A string or number that's used to insert white space into the output JSON string for readability purposes.
 * @returns A JSON string representing the given value, or the original value if the conversion fails.
 */
const jsonSafeStringify: JsonSafeStringifyFunction = (
    value: any,
    replacer?: ((key: string, value: any) => any) | (string | number)[],
    space?: string | number,
): string | any => {
    try {
        return JSON.stringify(value, replacer as any, space);
    } catch (e) {}

    return value;
};

// Fetch cache
const cache: Record<string, CacheValue> = {}; // key: { value:{fetchKey:Promise}, expiry }

/**
 * Processes the cache based on the provided options, fetch function, and request.
 *
 * @param request - The request object.
 * @param options - An object containing the cacheKey, cacheKeyExpiry, and cacheExpiry options.
 * @param fetch - A function used to fetch data. Defaults to an empty function.
 * @returns Contains the value and expiry of the cache.
 */
const processCache: ProcessCacheFunction = (
    request: AzureFunctionRequest,
    options: CacheOptions,
    fetch: FetchFunction = () => undefined,
): ProcessCacheResult => {
    let { cacheKey, cacheKeyExpiry, cacheExpiry } = options;
    cacheExpiry = cacheKeyExpiry?.[cacheKey] ?? cacheExpiry;
    const now = Date.now();
    if (cacheExpiry) {
        const cached = getCache(cacheKey);
        const unexpired =
            cached.expiry && (cacheExpiry < 0 || cached.expiry > now);

        if (unexpired) {
            if (cached.modified) {
                const value = fetch(request, cached.value);
                Object.assign(cached.value, value);
                cache[cacheKey] = {
                    value: cached.value,
                    expiry: cached.expiry || undefined,
                } as CacheValue;
                return cache[cacheKey]!;
            }
            return { ...cached, cache: true };
        }
    }
    const value = fetch(request);
    const expiry =
        cacheExpiry && cacheExpiry > 86400000
            ? cacheExpiry
            : now + (cacheExpiry || 0);
    if (cacheExpiry) {
        cache[cacheKey] = { value, expiry };
    }
    return { value, expiry };
};

/**
 * Retrieves the cached value associated with the given key.
 *
 * @param key - The key used to retrieve the cached value.
 * @returns The cached value associated with the given key, or an empty object if the key does not exist in the cache.
 */
const getCache: GetCacheFunction = (key: string): CacheValue => {
    if (!cache[key]) return { value: undefined };
    return cache[key];
};

/**
 * Modifies the cache with the given cacheKey and value. Can be used to remove parts of a cache.
 *
 * @param cacheKey - The key of the cache to be modified.
 * @param value - The new value to be assigned to the cache.
 * @returns This function does not return any value.
 */
const modifyCache: ModifyCacheFunction = (
    cacheKey: string,
    value: any,
): void => {
    if (!cache[cacheKey]) return;
    cache[cacheKey] = { ...cache[cacheKey], value, modified: true };
};

/**
 * Clears the cache by setting the values of the specified keys to undefined.
 * If no keys are provided, all keys in the cache will be cleared.
 *
 * @param keys - The keys to clear from the cache. If null, all keys will be cleared. If a string, only that key will be cleared. If an array, all keys in the array will be cleared.
 * @returns This function does not return any value.
 */
const clearCache: ClearCacheFunction = (
    keys: string[] | string | null = null,
): void => {
    keys = keys ?? Object.keys(cache);
    if (!Array.isArray(keys)) keys = [keys];
    for (const cacheKey of keys) {
        cache[cacheKey] = undefined as any;
    }
};

const isPromise = (promise: any): boolean =>
    typeof promise?.then === "function";

/**
 * Retrieves internal values based on the provided variables and request.
 *
 * @param variables - The variables to retrieve internal values for.
 * @param request - The request object.
 * @returns An object containing the retrieved internal values.
 * @throws If any of the internal values fail to resolve.
 */
const getInternal: GetInternalFunction = async (
    variables: boolean | string | string[] | Record<string, any>,
    request: AzureFunctionRequest,
): Promise<InternalVariables> => {
    if (!variables || !request) return {};
    let keys: string[] = [];
    let values: string[] = [];
    if (variables === true) {
        keys = values = Object.keys(request.internal);
    } else if (typeof variables === "string") {
        keys = values = [variables];
    } else if (Array.isArray(variables)) {
        keys = values = variables;
    } else if (typeof variables === "object") {
        keys = Object.keys(variables);
        values = Object.values(variables);
    }
    const promises: Promise<any>[] = [];
    for (const internalKey of values) {
        // 'internal.key.sub_value' -> { [key]: internal.key.sub_value }
        const pathOptionKey = internalKey.split(".");
        const rootOptionKey = pathOptionKey.shift()!;
        let valuePromise = request.internal[rootOptionKey];
        if (!isPromise(valuePromise)) {
            valuePromise = Promise.resolve(valuePromise);
        }
        promises.push(
            valuePromise.then((value: any) =>
                pathOptionKey.reduce((p: any, c: string) => p?.[c], value),
            ),
        );
    }
    // ensure promise has resolved by the time it's needed
    // If one of the promises throws it will bubble up to @kevboutin/azure-middy-core
    const results = await Promise.allSettled(promises);
    const errors = results
        .filter((res) => res.status === "rejected")
        .map((res) => (res as PromiseRejectedResult).reason);
    if (errors.length) {
        throw new Error("Failed to resolve internal values", {
            cause: { package: "@kevboutin/azure-middy-util", data: errors },
        });
    }
    return keys.reduce(
        (obj, key, index) => ({
            ...obj,
            [key]: (results[index] as PromiseFulfilledResult<any>).value,
        }),
        {},
    );
};

/**
 * Normalizes the HTTP response object by ensuring that it has the required properties.
 *
 * @param request - The request object.
 * @returns The normalized response object.
 */
const normalizeHttpResponse: NormalizeHttpResponseFunction = (
    request: AzureFunctionRequest,
): NormalizedHttpResponse => {
    let { response } = request;
    if (typeof response === "undefined") {
        response = {};
    } else if (
        typeof response?.statusCode === "undefined" &&
        typeof response?.body === "undefined" &&
        typeof response?.headers === "undefined"
    ) {
        response = { statusCode: 200, body: response };
    }
    response.statusCode ??= 500;
    response.headers ??= {};
    (request as any).response = response;
    return response;
};

export {
    clearCache,
    getCache,
    modifyCache,
    processCache,
    getInternal,
    jsonSafeParse,
    jsonSafeStringify,
    normalizeHttpResponse,
};

export type {
    CacheOptions,
    CacheValue,
    ProcessCacheResult,
    AzureFunctionRequest,
    FetchFunction,
    InternalVariables,
    NormalizedHttpResponse,
    JsonSafeParseFunction,
    JsonSafeStringifyFunction,
    ProcessCacheFunction,
    GetCacheFunction,
    ModifyCacheFunction,
    ClearCacheFunction,
    GetInternalFunction,
    NormalizeHttpResponseFunction,
};
