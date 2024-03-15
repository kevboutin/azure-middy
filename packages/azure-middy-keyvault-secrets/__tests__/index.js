const { SecretClient } = require("@azure/keyvault-secrets");
const test = require("ava");
const sinon = require("sinon");
const middy = require("../../azure-middy-core/index.js");
const { getInternal, clearCache } = require("@kevboutin/azure-middy-util");
const keyvaultSecretsMiddleware = require("../index.js");

let sandbox, stub;
test.beforeEach(async (t) => {
    sandbox = sinon.createSandbox();
});

test.afterEach(async (t) => {
    sandbox.restore();
    clearCache();
});

const req = {};
const context = {
    getRemainingTimeInMillis: () => 1000,
};

test.serial("It should set secret to internal storage (token)", async (t) => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        sinon.assert.calledOnce(stub);
        t.is(values.token, "value");
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
test.serial("It should set secrets to internal storage (token)", async (t) => {
    stub = sandbox.stub(SecretClient.prototype, "getSecret").resolves("value");
    const handler = middy(() => {});

    const middleware = async (request) => {
        const values = await getInternal(true, request);
        t.is(values.token1, "value");
        t.is(values.token2, "value");
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
test.serial("It should set secrets to internal storage (json)", async (t) => {
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
        t.deepEqual(values, credentials);
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

test.serial(
    "It should not call secret client again if parameter is cached",
    async (t) => {
        stub = sandbox
            .stub(SecretClient.prototype, "getSecret")
            .resolves("value");
        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            t.is(values.someprop, "value");
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

        t.is(stub.callCount, 1);
    },
);

test.serial(
    "It should call secret client if cache enabled but cached param has expired",
    async (t) => {
        stub = sandbox
            .stub(SecretClient.prototype, "getSecret")
            .resolves("value");
        const handler = middy(() => {});

        const middleware = async (request) => {
            const values = await getInternal(true, request);
            t.is(values.token, "value");
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

        t.is(stub.callCount, 2);
    },
);
