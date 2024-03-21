const test = require("ava");
const sinon = require("sinon");
const { setTimeout } = require("node:timers/promises");
const {
    jsonSafeParse,
    jsonSafeStringify,
    processCache,
    clearCache,
    getCache,
    modifyCache,
    normalizeHttpResponse,
    getInternal,
} = require("../index");

// jsonSafeParse
test("jsonSafeParse should parse valid json", async (t) => {
    const value = jsonSafeParse("{}");
    t.deepEqual(value, {});
});
test("jsonSafeParse should not parse object", async (t) => {
    const value = jsonSafeParse({});
    t.deepEqual(value, {});
});
test("jsonSafeParse should not parse string", async (t) => {
    const value = jsonSafeParse("value");
    t.is(value, "value");
});
test("jsonSafeParse should not parse empty string", async (t) => {
    const value = jsonSafeParse("");
    t.is(value, "");
});
test("jsonSafeParse should not parse null", async (t) => {
    const value = jsonSafeParse(null);
    t.is(value, null);
});
test("jsonSafeParse should not parse number", async (t) => {
    const value = jsonSafeParse(1);
    t.is(value, 1);
});
test("jsonSafeParse should not parse nested function", async (t) => {
    const value = jsonSafeParse("{fct:() => {}}");
    t.is(value, "{fct:() => {}}");
});

// jsonSafeStringify
test("jsonSafeStringify should stringify valid json", async (t) => {
    const value = jsonSafeStringify({ hello: ["world"] });
    t.is(value, '{"hello":["world"]}');
});
test("jsonSafeStringify should stringify with replacer", async (t) => {
    const value = jsonSafeStringify(
        JSON.stringify({ msg: JSON.stringify({ hello: ["world"] }) }),
        (key, value) => jsonSafeParse(value),
    );
    t.is(value, '{"msg":{"hello":["world"]}}');
});
test("jsonSafeStringify should not stringify if throws error", async (t) => {
    const value = jsonSafeStringify({ bigint: BigInt(9007199254740991) });
    t.deepEqual(value, { bigint: BigInt(9007199254740991) });
});

// normalizeHttpResponse
test("normalizeHttpResponse should not change response", async (t) => {
    const request = {
        response: { headers: {} },
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 500, headers: {} });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update headers in response", async (t) => {
    const request = {
        response: {},
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 200, headers: {}, body: {} });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update undefined response", async (t) => {
    const request = {};
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 500, headers: {} });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update incomplete response", async (t) => {
    const request = {
        response: {
            body: "",
        },
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 500, headers: {}, body: "" });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update nullish response", async (t) => {
    const request = {
        response: null,
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 200, headers: {}, body: null });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update string response", async (t) => {
    const request = {
        response: "",
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 200, headers: {}, body: "" });
    t.deepEqual(request, { response });
});
test("normalizeHttpResponse should update array response", async (t) => {
    const request = {
        response: [],
    };
    const response = normalizeHttpResponse(request);
    t.deepEqual(response, { statusCode: 200, headers: {}, body: [] });
    t.deepEqual(request, { response });
});

// processCache / clearCache
const cacheRequest = {
    internal: {},
};
test.serial("processCache should not cache", async (t) => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: 0,
    };
    processCache(options, fetch, cacheRequest);
    const cache = getCache("key");
    t.deepEqual(cache, {});
    clearCache();
});
test.serial("processCache should cache forever", async (t) => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: -1,
    };
    processCache(options, fetch, cacheRequest);
    await setTimeout(100);
    const cacheValue = getCache("key").value;
    t.is(await cacheValue, "value");
    const { value, cache } = processCache(options, fetch, cacheRequest);
    t.is(await value, "value");
    t.true(cache);
    t.is(fetch.callCount, 1);
    clearCache();
});
test.serial("processCache should cache when not expired", async (t) => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key",
        cacheExpiry: 100,
    };
    processCache(options, fetch, cacheRequest);
    await setTimeout(50);
    const cacheValue = getCache("key").value;
    t.is(await cacheValue, "value");
    const { value, cache } = processCache(options, fetch, cacheRequest);
    t.is(await value, "value");
    t.is(cache, true);
    t.is(fetch.callCount, 1);
    clearCache();
});
test.serial(
    "processCache should cache when not expired w/ unix timestamp",
    async (t) => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: Date.now() + 100,
        };
        processCache(options, fetch, cacheRequest);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        t.is(await cacheValue, "value");
        const { value, cache } = processCache(options, fetch, cacheRequest);
        t.is(await value, "value");
        t.is(cache, true);
        t.is(fetch.callCount, 1);
        clearCache();
    },
);
test.serial(
    "processCache should cache when not expired using cacheKeyExpire",
    async (t) => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: 0,
            cacheKeyExpiry: { key: Date.now() + 100 },
        };
        processCache(options, fetch, cacheRequest);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        t.is(await cacheValue, "value");
        const { value, cache } = processCache(options, fetch, cacheRequest);
        t.is(await value, "value");
        t.is(cache, true);
        t.is(fetch.callCount, 1);
        clearCache();
    },
);
test.serial(
    "processCache should cache when not expired using cacheKeyExpire w/ unix timestamp",
    async (t) => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key",
            cacheExpiry: Date.now() + 0,
            cacheKeyExpiry: { key: Date.now() + 100 },
        };
        processCache(options, fetch, cacheRequest);
        await setTimeout(50);
        const cacheValue = getCache("key").value;
        t.is(await cacheValue, "value");
        const { value, cache } = processCache(options, fetch, cacheRequest);
        t.is(await value, "value");
        t.is(cache, true);
        t.is(fetch.callCount, 1);
        clearCache();
    },
);
test.serial(
    "processCache should clear and re-fetch modified cache",
    async (t) => {
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
            t.deepEqual(cached, {
                a: "value",
                b: undefined,
            });
            return {
                b: "value",
            };
        };

        const cached = processCache(options, fetch, cacheRequest);
        const request = {
            internal: cached.value,
        };
        try {
            await getInternal(true, request);
        } catch (e) {
            let cache = getCache(options.cacheKey);

            t.true(cache.modified);
            t.deepEqual(cache.value, {
                a: "value",
                b: undefined,
            });
            t.is(e.message, "Failed to resolve internal values");
            t.deepEqual(e.cause, {
                package: "@kevboutin/azure-middy-util",
                data: [new Error("error")],
            });

            processCache(options, fetchCached, cacheRequest);
            cache = getCache(options.cacheKey);

            t.is(cache.modified, undefined);
            t.deepEqual(cache.value, {
                a: "value",
                b: "value",
            });
        }
        clearCache();
    },
);
test.serial("processCache should cache and expire", async (t) => {
    const fetch = sinon.stub().resolves("value");
    const options = {
        cacheKey: "key-cache-expire",
        cacheExpiry: 150,
    };
    processCache(options, fetch, cacheRequest);
    await setTimeout(100);
    let cache = getCache("key-cache-expire");
    t.not(cache, undefined);
    await setTimeout(250); // expire twice
    cache = getCache("key-cache-expire");
    t.true(cache.expiry < Date.now());
    clearCache();
});
test.serial(
    "processCache should cache and expire w/ unix timestamp",
    async (t) => {
        const fetch = sinon.stub().resolves("value");
        const options = {
            cacheKey: "key-cache-unix-expire",
            cacheExpiry: Date.now() + 155,
        };
        processCache(options, fetch, cacheRequest);
        await setTimeout(100);
        let cache = getCache("key-cache-unix-expire");
        t.not(cache, undefined);
        await setTimeout(250); // expire once, then doesn't cache
        cache = getCache("key-cache-unix-expire");

        t.true(cache.expiry < Date.now());
        clearCache();
    },
);
test.serial("processCache should clear single key cache", async (t) => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    processCache(
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    clearCache("other");
    t.not(getCache("key").value, undefined);
    t.deepEqual(getCache("other"), {});
    clearCache();
});
test.serial("processCache should clear multi-key cache", async (t) => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    processCache(
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    clearCache(["key", "other"]);
    t.deepEqual(getCache("key"), {});
    t.deepEqual(getCache("other"), {});
    clearCache();
});
test.serial("processCache should clear all cache", async (t) => {
    const fetch = sinon.stub().resolves("value");
    processCache(
        {
            cacheKey: "key",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    processCache(
        {
            cacheKey: "other",
            cacheExpiry: -1,
        },
        fetch,
        cacheRequest,
    );
    clearCache();
    t.deepEqual(getCache("key"), {});
    t.deepEqual(getCache("other"), {});
    clearCache();
});

// modifyCache
test.serial(
    "modifyCache should not override value when it does not exist",
    async (t) => {
        modifyCache("key");
        t.deepEqual(getCache("key"), {});
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
test("getInternal should get none from internal store", async (t) => {
    const values = await getInternal(false, getInternalRequest);
    t.deepEqual(values, {});
});
test("getInternal should get all from internal store", async (t) => {
    const values = await getInternal(true, getInternalRequest);
    t.deepEqual(values, {
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
test("getInternal should get from internal store when string", async (t) => {
    const values = await getInternal("number", getInternalRequest);
    t.deepEqual(values, { number: 1 });
});
test("getInternal should get from internal store when array[string]", async (t) => {
    const values = await getInternal(["boolean", "string"], getInternalRequest);
    t.deepEqual(values, { boolean: true, string: "string" });
});
test("getInternal should get from internal store when object", async (t) => {
    const values = await getInternal({ newKey: "promise" }, getInternalRequest);
    t.deepEqual(values, { newKey: "promise" });
});
test("getInternal should get from internal store a nested value", async (t) => {
    const values = await getInternal("promiseObject.key", getInternalRequest);
    t.deepEqual(values, { "promiseObject.key": "value" });
});
