import { test, expect } from 'vitest';
import sinon from "sinon";
import { setTimeout } from "node:timers/promises";
import {
    jsonSafeParse,
    jsonSafeStringify,
    processCache,
    clearCache,
    getCache,
    modifyCache,
    normalizeHttpResponse,
    getInternal,
} from "../dist/index.js";

// jsonSafeParse
test("jsonSafeParse should parse valid json", async () => {
    const value = jsonSafeParse("{}");
    expect(value).toEqual({});
});
test("jsonSafeParse should not parse object", async () => {
    const value = jsonSafeParse({});
    expect(value).toEqual({});
});
test("jsonSafeParse should not parse string", async () => {
    const value = jsonSafeParse("value");
    expect(value).toBe("value");
});
test("jsonSafeParse should not parse empty string", async () => {
    const value = jsonSafeParse("");
    expect(value).toBe("");
});
test("jsonSafeParse should not parse null", async () => {
    const value = jsonSafeParse(null);
    expect(value).toBe(null);
});
test("jsonSafeParse should not parse number", async () => {
    const value = jsonSafeParse(1);
    expect(value).toBe(1);
});
test("jsonSafeParse should not parse nested function", async () => {
    const value = jsonSafeParse("{fct:() => {}}");
    expect(value).toBe("{fct:() => {}}");
});

// jsonSafeStringify
test("jsonSafeStringify should stringify valid json", async () => {
    const value = jsonSafeStringify({ hello: ["world"] });
    expect(value).toBe('{"hello":["world"]}');
});
test("jsonSafeStringify should stringify with replacer", async () => {
    const value = jsonSafeStringify(
        JSON.stringify({ msg: JSON.stringify({ hello: ["world"] }) }),
        (key, value) => jsonSafeParse(value),
    );
    expect(value).toBe('{"msg":{"hello":["world"]}}');
});
test("jsonSafeStringify should not stringify if throws error", async () => {
    const value = jsonSafeStringify({ bigint: BigInt(9007199254740991) });
    expect(value).toEqual({ bigint: BigInt(9007199254740991) });
});

// normalizeHttpResponse
test("normalizeHttpResponse should not change response", async () => {
    const request = {
        response: { headers: {} },
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 500, headers: {} });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update headers in response", async () => {
    const request = {
        response: {},
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 200, headers: {}, body: {} });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update undefined response", async () => {
    const request = {};
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 500, headers: {} });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update incomplete response", async () => {
    const request = {
        response: {
            body: "",
        },
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 500, headers: {}, body: "" });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update nullish response", async () => {
    const request = {
        response: null,
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 200, headers: {}, body: null });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update string response", async () => {
    const request = {
        response: "",
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 200, headers: {}, body: "" });
    expect(request).toEqual({ response });
});
test("normalizeHttpResponse should update array response", async () => {
    const request = {
        response: [],
    };
    const response = normalizeHttpResponse(request);
    expect(response).toEqual({ statusCode: 200, headers: {}, body: [] });
    expect(request).toEqual({ response });
});

// processCache / clearCache
const cacheRequest = {
    internal: {},
};
test("processCache should not cache", async () => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: 0,
    };
    processCache(cacheRequest, options, fetch);
    const cache = getCache("key");
    expect(cache).toEqual({});
    clearCache();
});
test("processCache should cache forever", async () => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: -1,
    };
    processCache(cacheRequest, options, fetch);
    await setTimeout(100);
    const cacheValue = getCache("key").value;
    expect(await cacheValue).toBe("value");
    const { value, cache } = processCache(cacheRequest, options, fetch);
    expect(await value).toBe("value");
    expect(cache);
    expect(fetch.callCount).toBe(1);
    clearCache();
});
test("processCache should cache when not expired", async () => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: 100,
    };
    processCache(cacheRequest, options, fetch);
    await setTimeout(50);
    const cacheValue = getCache("key").value;
    expect(await cacheValue).toBe("value");
    const { value, cache } = processCache(cacheRequest, options, fetch);
    expect(await value).toBe("value");
    expect(cache).toBe(true);
    expect(fetch.callCount).toBe(1);
    clearCache();
});
test(
    "processCache should cache when not expired w/ unix timestamp",
    async () => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: Date.now() + 100,
        };
        processCache(cacheRequest, options, fetch);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        expect(await cacheValue).toBe("value");
        const { value, cache } = processCache(cacheRequest, options, fetch);
        expect(await value).toBe("value");
        expect(cache).toBe(true);
        expect(fetch.callCount).toBe(1);
        clearCache();
    },
);
test(
    "processCache should cache when not expired using cacheKeyExpire",
    async () => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: 0,
            cacheKeyExpiry: { key: Date.now() + 100 },
        };
        processCache(cacheRequest, options, fetch);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        expect(await cacheValue).toBe("value");
        const { value, cache } = processCache(cacheRequest, options, fetch);
        expect(await value).toBe("value");
        expect(cache).toBe(true);
        expect(fetch.callCount).toBe(1);
        clearCache();
    },
);
test(
    "processCache should cache when not expired using cacheKeyExpire w/ unix timestamp",
    async () => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: Date.now() + 0,
            cacheKeyExpiry: { key: Date.now() + 100 },
        };
        processCache(cacheRequest, options, fetch);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        expect(await cacheValue).toBe("value");
        const { value, cache } = processCache(cacheRequest, options, fetch);
        expect(await value).toBe("value");
        expect(cache).toBe(true);
        expect(fetch.callCount).toBe(1);
        clearCache();
    },
);
test(
    "processCache should clear and re-fetch modified cache",
    async () => {
        const options = {
            cacheKey: "key",
            cacheExpiry: -1,
        };
        const fetch = sinon.stub().returns({
            a: "value",
            b: new Promise(() => {
                throw new Error("error");
            }).catch((e) => {
                const value = getCache(options.cacheKey).value || { value: {} };
                const internalKey = "b";
                value[internalKey] = undefined;
                modifyCache(options.cacheKey, value);
                throw e;
            }),
        });
        const fetchCached = (request, cached) => {
            expect(cached).toEqual({
                a: "value",
                b: undefined,
            });
            return {
                b: "value",
            };
        };

        const cached = processCache(cacheRequest, options, fetch);
        const request = {
            internal: cached.value,
        };
        try {
            await getInternal(true, request);
        } catch (e) {
            let cache = getCache(options.cacheKey);

            expect(cache.modified);
            expect(cache.value).toEqual({
                a: "value",
                b: undefined,
            });
            expect(e.message).toBe("Failed to resolve internal values");
            expect(e.cause).toEqual({
                package: "@kevboutin/azure-middy-util",
                data: [new Error("error")],
            });

            processCache(cacheRequest, options, fetchCached);
            cache = getCache(options.cacheKey);

            expect(cache.modified).toBe(undefined);
            expect(cache.value).toEqual({
                a: "value",
                b: "value",
            });
        }
        clearCache();
    },
);
test("processCache should cache and expire", async () => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key-cache-expire",
        cacheExpiry: 150,
    };
    processCache(cacheRequest, options, fetch);
    await setTimeout(100);
    let cache = getCache("key-cache-expire");
    expect(cache, undefined);
    await setTimeout(250); // expire twice
    cache = getCache("key-cache-expire");
    expect(cache.expiry < Date.now());
    clearCache();
});
test(
    "processCache should cache and expire w/ unix timestamp",
    async () => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key-cache-unix-expire",
            cacheExpiry: Date.now() + 155,
        };
        processCache(cacheRequest, options, fetch);
        await setTimeout(100);
        let cache = getCache("key-cache-unix-expire");
        expect(cache, undefined);
        await setTimeout(250); // expire once, then doesn't cache
        cache = getCache("key-cache-unix-expire");

        expect(cache.expiry < Date.now());
        clearCache();
    },
);
test("processCache should clear single key cache", async () => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        cacheRequest,
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
    );
    processCache(
        cacheRequest,
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
    );
    clearCache("other");
    expect(getCache("key").value, undefined);
    expect(getCache("other")).toEqual({});
    clearCache();
});
test("processCache should clear multi-key cache", async () => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        cacheRequest,
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
    );
    processCache(
        cacheRequest,
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
    );
    clearCache(["key", "other"]);
    expect(getCache("key")).toEqual({});
    expect(getCache("other")).toEqual({});
    clearCache();
});
test("processCache should clear all cache", async () => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        cacheRequest,
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
    );
    processCache(
        cacheRequest,
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
    );
    clearCache();
    expect(getCache("key")).toEqual({});
    expect(getCache("other")).toEqual({});
    clearCache();
});

// modifyCache
test(
    "modifyCache should not override value when it does not exist",
    async () => {
        modifyCache("key");
        expect(getCache("key")).toEqual({});
    },
);

// getInternal
const getInternalRequest = {
    internal: {
        boolean: true,
        number: 1,
        string: "string",
        array: [],
        object: {
            key: "value",
        },
        promise: Promise.resolve("promise"),
        promiseObject: Promise.resolve({
            key: "value",
        }),
        // promiseReject: Promise.reject('promise')
    },
};
test("getInternal should get none from internal store", async () => {
    const values = await getInternal(false, getInternalRequest);
    expect(values).toEqual({});
});
test("getInternal should get all from internal store", async () => {
    const values = await getInternal(true, getInternalRequest);
    expect(values).toEqual({
        array: [],
        boolean: true,
        number: 1,
        object: {
            key: "value",
        },
        promise: "promise",
        promiseObject: {
            key: "value",
        },
        string: "string",
    });
});
test("getInternal should get from internal store when string", async () => {
    const values = await getInternal("number", getInternalRequest);
    expect(values).toEqual({ number: 1 });
});
test("getInternal should get from internal store when array[string]", async () => {
    const values = await getInternal(["boolean", "string"], getInternalRequest);
    expect(values).toEqual({ boolean: true, string: "string" });
});
test("getInternal should get from internal store when object", async () => {
    const values = await getInternal({ newKey: "promise" }, getInternalRequest);
    expect(values).toEqual({ newKey: "promise" });
});
test("getInternal should get from internal store a nested value", async () => {
    const values = await getInternal("promiseObject.key", getInternalRequest);
    expect(values).toEqual({ "promiseObject.key": "value" });
});
