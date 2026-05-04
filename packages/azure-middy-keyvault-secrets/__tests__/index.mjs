import { test, expect, beforeEach, afterEach } from "vitest";
import { createRequire } from "module";
import sinon from "sinon";
const require = createRequire(import.meta.url);
const { SecretClient } = require("@azure/keyvault-secrets");
import middy from "../../azure-middy-core/dist/index.js";
import { getInternal, clearCache } from "@kevboutin/azure-middy-util";
import keyvaultSecretsMiddleware from "../dist/index.js";

let sandbox, stub;
beforeEach(async () => {
    sandbox = sinon.createSandbox();
});

afterEach(async () => {
    sandbox.restore();
    clearCache();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test("It should set secret to internal storage (token)", async () => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        sinon.assert.calledOnce(stub);
        expect(values.token).toBe("value");
    };

    handler
        .use(
            keyvaultSecretsMiddleware({
                vaultUrl: "https://azure_keyvault.vault.azure.net",
                cacheExpiry: 0,
                fetchData: {
                    token: "api_key",
                },
            }),
        )
        .before(middleware);

    await handler(context, req);
});
test("It should set secrets to internal storage (token)", async () => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        expect(values.token1).toBe("value");
        expect(values.token2).toBe("value");
    };

    handler
        .use(
            keyvaultSecretsMiddleware({
                vaultUrl: "https://azure_keyvault.vault.azure.net",
                cacheExpiry: 0,
                fetchData: {
                    token1: "api_key1",
                    token2: "api_key2",
                },
            }),
        )
        .before(middleware);

    await handler(context, req);
});
test("It should set secrets to internal storage (json)", async () => {
    const credentials = { username: "value", password: "value" };
    stub = sandbox
        .stub(SecretClient.prototype, "getSecret")
        .resolves(credentials);
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(
            {
                username: "credentials.username",
                password: "credentials.password",
            },
            request,
        );
        expect(values).toEqual(credentials);
    };

    handler
        .use(
            keyvaultSecretsMiddleware({
                vaultUrl: "https://azure_keyvault.vault.azure.net",
                cacheExpiry: 0,
                fetchData: {
                    credentials: "some_login",
                },
            }),
        )
        .before(middleware);

    await handler(context, req);
});

test("It should not call secret client again if parameter is cached", async () => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        expect(values.someprop).toBe("value");
    };

    handler
        .use(
            keyvaultSecretsMiddleware({
                vaultUrl: "https://azure_keyvault.vault.azure.net",
                cacheExpiry: -1,
                fetchData: {
                    someprop: "api_key",
                },
            }),
        )
        .before(middleware);

    await handler(context, req);
    await handler(context, req);

    expect(stub.callCount).toBe(1);
});

test("It should call secret client if cache enabled but cached param has expired", async () => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        expect(values.token).toBe("value");
    };

    handler
        .use(
            keyvaultSecretsMiddleware({
                vaultUrl: "https://azure_keyvault.vault.azure.net",
                cacheExpiry: 0,
                fetchData: {
                    token: "api_key",
                },
            }),
        )
        .before(middleware);

    await handler(context, req);
    await handler(context, req);

    expect(stub.callCount).toBe(2);
});
