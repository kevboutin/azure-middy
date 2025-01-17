/**
 * Safely parses a JSON string into a JavaScript value.
 *
 * @param {string} text - The JSON string to be parsed.
 * @param {function} [reviver] - A function that transforms the parsed value before returning it.
 * @returns {*} - The parsed JavaScript value, or the original text if parsing fails.
 */
const jsonSafeParse = (text, reviver) => {
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
 * @param {*} value - The value to be converted to a JSON string.
 * @param {function|array} [replacer] - A function that alters the behavior of the stringification process, or an array of strings and numbers that acts as a whitelist for selecting/filtering the properties of the value object to be included in the JSON string.
 * @param {string|number} [space] - A string or number that's used to insert white space into the output JSON string for readability purposes.
 * @returns {string} - A JSON string representing the given value, or the original value if the conversion fails.
 */
const jsonSafeStringify = (value, replacer, space) => {
    try {
        return JSON.stringify(value, replacer, space);
    } catch (e) {}

    return value;
};

// Fetch cache
const cache = {}; // key: { value:{fetchKey:Promise}, expiry }

/**
 * Processes the cache based on the provided options, fetch function, and request.
 *
 * @param {Object} request The request object.
 * @param {Object} options An object containing the cacheKey, cacheKeyExpiry, and cacheExpiry options.
 * @param {Function} fetch A function used to fetch data. Defaults to an empty function.
 * @returns {Object} Contains the value and expiry of the cache.
 */
const processCache = (request, options, fetch = () => undefined) => {
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
                    expiry: cached.expiry,
                };
                return cache[cacheKey];
            }
            return { ...cached, cache: true };
        }
    }
    const value = fetch(request);
    const expiry = cacheExpiry > 86400000 ? cacheExpiry : now + cacheExpiry;
    if (cacheExpiry) {
        cache[cacheKey] = { value, expiry };
    }
    return { value, expiry };
};

/**
 * Retrieves the cached value associated with the given key.
 *
 * @param {string} key - The key used to retrieve the cached value.
 * @returns {Object} - The cached value associated with the given key, or an empty object if the key does not exist in the cache.
 */
const getCache = (key) => {
    if (!cache[key]) return {};
    return cache[key];
};

/**
 * Modifies the cache with the given cacheKey and value. Can be used to remove parts of a cache.
 *
 * @param {string} cacheKey - The key of the cache to be modified.
 * @param {*} value - The new value to be assigned to the cache.
 * @returns {undefined} - This function does not return any value.
 */
const modifyCache = (cacheKey, value) => {
    if (!cache[cacheKey]) return;
    cache[cacheKey] = { ...cache[cacheKey], value, modified: true };
};

/**
 * Clears the cache by setting the values of the specified keys to undefined.
 * If no keys are provided, all keys in the cache will be cleared.
 *
 * @param {Array|string|null} keys - The keys to clear from the cache. If null, all keys will be cleared. If a string, only that key will be cleared. If an array, all keys in the array will be cleared.
 * @returns {undefined}
 */
const clearCache = (keys = null) => {
    keys = keys ?? Object.keys(cache);
    if (!Array.isArray(keys)) keys = [keys];
    for (const cacheKey of keys) {
        cache[cacheKey] = undefined;
    }
};

const isPromise = (promise) => typeof promise?.then === "function";

/**
 * Retrieves internal values based on the provided variables and request.
 *
 * @param {boolean|string|string[]|Object} variables - The variables to retrieve internal values for.
 * @param {Object} request - The request object.
 * @returns {Object} - An object containing the retrieved internal values.
 * @throws {Error} - If any of the internal values fail to resolve.
 */
const getInternal = async (variables, request) => {
    if (!variables || !request) return {};
    let keys = [];
    let values = [];
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
    const promises = [];
    for (const internalKey of values) {
        // 'internal.key.sub_value' -> { [key]: internal.key.sub_value }
        const pathOptionKey = internalKey.split(".");
        const rootOptionKey = pathOptionKey.shift();
        let valuePromise = request.internal[rootOptionKey];
        if (!isPromise(valuePromise)) {
            valuePromise = Promise.resolve(valuePromise);
        }
        promises.push(
            valuePromise.then((value) =>
                pathOptionKey.reduce((p, c) => p?.[c], value),
            ),
        );
    }
    // ensure promise has resolved by the time it's needed
    // If one of the promises throws it will bubble up to @kevboutin/azure-middy-core
    values = await Promise.allSettled(promises);
    const errors = values
        .filter((res) => res.status === "rejected")
        .map((res) => res.reason);
    if (errors.length) {
        throw new Error("Failed to resolve internal values", {
            cause: { package: "@kevboutin/azure-middy-util", data: errors },
        });
    }
    return keys.reduce(
        (obj, key, index) => ({
            ...obj,
            [key]: values[index].value,
        }),
        {},
    );
};

/**
 * Normalizes the HTTP response object by ensuring that it has the required properties.
 *
 * @param {Object} request - The request object.
 * @returns {Object} - The normalized response object.
 */
const normalizeHttpResponse = (request) => {
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
    request.response = response;
    return response;
};

module.exports = {
    clearCache,
    getCache,
    modifyCache,
    processCache,
    getInternal,
    jsonSafeParse,
    jsonSafeStringify,
    normalizeHttpResponse,
};
