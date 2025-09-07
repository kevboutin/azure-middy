// Example TypeScript usage of the util functions
import {
    jsonSafeParse,
    jsonSafeStringify,
    processCache,
    getCache,
    modifyCache,
    clearCache,
    getInternal,
    normalizeHttpResponse,
    AzureFunctionRequest,
    CacheOptions,
} from "./index";

// Example JSON parsing with TypeScript
const jsonExample = {
    valid: jsonSafeParse('{"name": "John", "age": 30}'),
    invalid: jsonSafeParse("not a json string"),
    number: jsonSafeParse("42"),
};

console.log("JSON Parse Examples:", jsonExample);

// Example JSON stringifying with TypeScript
const stringifyExample = {
    object: jsonSafeStringify({ name: "John", age: 30 }),
    circular: jsonSafeStringify({ a: 1, b: { c: 2 } }), // This would fail normally
};

console.log("JSON Stringify Examples:", stringifyExample);

// Example cache operations with TypeScript
const cacheOptions: CacheOptions = {
    cacheKey: "example-cache",
    cacheExpiry: 60000, // 1 minute
};

const exampleRequest: AzureFunctionRequest = {
    internal: {
        user: { id: 1, name: "John" },
        settings: { theme: "dark", language: "en" },
    },
    method: "GET",
    url: "/api/example",
};

// Example fetch function
const fetchData = async (request: AzureFunctionRequest, cachedValues?: any) => {
    console.log(
        "Fetching data for request:",
        request["method"],
        request["url"],
    );
    return {
        timestamp: Date.now(),
        data: "example data",
    };
};

// Process cache example
const cacheResult = processCache(exampleRequest, cacheOptions, fetchData);
console.log("Cache Result:", cacheResult);

// Get cache example
const cachedValue = getCache("example-cache");
console.log("Cached Value:", cachedValue);

// Modify cache example
modifyCache("example-cache", { modified: true, data: "updated" });

// Get internal values example
const getInternalExample = async () => {
    try {
        const internalValues = await getInternal(
            ["user", "settings"],
            exampleRequest,
        );
        console.log("Internal Values:", internalValues);
    } catch (error) {
        console.error("Error getting internal values:", error);
    }
};

// Normalize HTTP response example
const requestWithResponse: AzureFunctionRequest = {
    internal: {},
    response: {
        body: JSON.stringify({ message: "Success" }),
        statusCode: 200,
    },
};

const normalizedResponse = normalizeHttpResponse(requestWithResponse);
console.log("Normalized Response:", normalizedResponse);

// Clear cache example
clearCache(["example-cache"]);

console.log("TypeScript example loaded successfully");
