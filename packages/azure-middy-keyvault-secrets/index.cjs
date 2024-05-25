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

/**
 * Middleware function for retrieving secrets from Azure Key Vault.
 *
 * @param {Object} opts - Options for the middleware.
 * @param {string} opts.cacheKey - The key to use for caching the secrets.
 * @param {Object} opts.fetchData - The data to fetch from Key Vault.
 * @param {string} opts.vaultUrl - The URL of the Key Vault.
 * @returns {Object} - The middleware function.
 */
const keyvaultSecretsMiddleware = (opts = {}) => {
    const options = { ...defaults, ...opts };

    /**
     * Fetches secrets from Azure Key Vault and adds them to the request object.
     *
     * @param {Object} request - The request object.
     * @param {Object} cachedValues - The cached values object.
     * @returns {Object} - The fetched values object.
     * @throws {Error} - If an error occurs while fetching the secrets.
     */
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

    /** @type {class} SecretClient */
    let client;
    /** @type {class} DefaultAzureCredential */
    const credential = new DefaultAzureCredential();

    /**
     * Middleware function that retrieves secrets from Azure Key Vault and adds them to the request object.
     *
     * @param {Object} request - The request object.
     * @returns {Promise} - A promise that resolves when the middleware is complete.
     */
    const keyvaultSecretsMiddlewareBefore = async (request) => {
        if (!client) {
            client = new SecretClient(options.vaultUrl, credential);
        }

        const { value } = processCache(options, fetch, request);
        if (value) {
            value.then((res) => {
                Object.assign(request.internal, res);
            });
        }

        await getInternal(Object.keys(options.fetchData), request);
    };

    return {
        before: keyvaultSecretsMiddlewareBefore,
    };
};

module.exports = keyvaultSecretsMiddleware;
