const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const {
    getCache,
    getInternal,
    modifyCache,
    processCache,
    jsonSafeParse,
} = require("@kevboutin/azure-middy-util");

const defaults = {
    cacheKey: "secrets",
    fetchData: {},
    vaultUrl: "",
};

const keyvaultSecretsMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts };

    const fetch = async (request, cachedValues = {}) => {
        const values = {};

        for (const internalKey of Object.keys(options.fetchData)) {
            if (cachedValues[internalKey]) continue;
            if (request.internal[internalKey]) continue;
            try {
                const rawValue = await client.getSecret(
                    options.fetchData[internalKey],
                );
                values[internalKey] = jsonSafeParse(rawValue);
            } catch (e) {
                const value = getCache(options.cacheKey).value ?? {};
                value[internalKey] = undefined;
                modifyCache(options.cacheKey, value);
                throw e;
            }
        }
        Object.assign(request.internal, values);
        return values;
    };

    let client;
    const credential = new DefaultAzureCredential();

    const keyvaultSecretsMiddlewareBefore = async (request) => {
        if (!client) {
            client = new SecretClient(options.vaultUrl, credential);
        }

        const { value } = processCache(options, fetch, request);
        Object.assign(request.internal, value);

        const data = await getInternal(Object.keys(options.fetchData), request);
        Object.assign(request.context, data);
    };

    return {
        before: keyvaultSecretsMiddlewareBefore,
    };
};

module.exports = keyvaultSecretsMiddleware;
