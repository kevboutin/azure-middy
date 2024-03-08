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

const jsonSafeStringify = (value, replacer, space) => {
    try {
        return JSON.stringify(value, replacer, space);
    } catch (e) {}

    return value;
};

// Fetch cache
const cache = {}; // key: { value:{fetchKey:Promise}, expiry }
const processCache = (options, fetch = () => undefined, request) => {
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

const getCache = (key) => {
    if (!cache[key]) return {};
    return cache[key];
};

// Used to remove parts of a cache
const modifyCache = (cacheKey, value) => {
    if (!cache[cacheKey]) return;
    cache[cacheKey] = { ...cache[cacheKey], value, modified: true };
};

const clearCache = (keys = null) => {
    keys = keys ?? Object.keys(cache);
    if (!Array.isArray(keys)) keys = [keys];
    for (const cacheKey of keys) {
        cache[cacheKey] = undefined;
    }
};

const isPromise = (promise) => typeof promise?.then === "function";

// Internal Context
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

module.exports = {
    clearCache,
    getCache,
    modifyCache,
    processCache,
    getInternal,
    jsonSafeParse,
    jsonSafeStringify,
};
