import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import {
    getCache,
    getInternal,
    modifyCache,
    processCache,
    jsonSafeParse,
} from "@kevboutin/azure-middy-util";
import {
    KeyVaultSecretsOptions,
    AzureFunctionRequest,
    KeyVaultSecretsMiddleware,
    CachedValues,
    FetchedValues,
} from "./typings";

const defaults: KeyVaultSecretsOptions = {
    cacheKey: "secrets",
    fetchData: {},
    vaultUrl: "",
};

/**
 * Middleware function for retrieving secrets from Azure Key Vault.
 *
 * @param opts - Options for the middleware.
 * @param opts.cacheKey - The key to use for caching the secrets.
 * @param opts.fetchData - The data to fetch from Key Vault.
 * @param opts.vaultUrl - The URL of the Key Vault.
 * @returns The middleware function.
 */
const keyvaultSecretsMiddleware = (
    opts: Partial<KeyVaultSecretsOptions> = {},
): KeyVaultSecretsMiddleware => {
    const options: KeyVaultSecretsOptions = { ...defaults, ...opts };

    /**
     * Fetches secrets from Azure Key Vault and adds them to the request object.
     *
     * @param request - The request object.
     * @param cachedValues - The cached values object.
     * @returns The fetched values object.
     * @throws If an error occurs while fetching the secrets.
     */
    const fetch = async (
        request: AzureFunctionRequest,
        cachedValues: CachedValues = {},
    ): Promise<FetchedValues> => {
        const values: FetchedValues = {};

        for (const internalKey of Object.keys(options.fetchData)) {
            if (cachedValues[internalKey]) continue;
            if (request.internal?.[internalKey]) continue;
            try {
                const rawValue = await client.getSecret(
                    options.fetchData[internalKey]!,
                );
                values[internalKey] = jsonSafeParse(rawValue);
            } catch (e) {
                const value = getCache(options.cacheKey!).value ?? {};
                value[internalKey] = undefined;
                modifyCache(options.cacheKey!, value);
                throw e;
            }
        }
        Object.assign(request.internal!, values);
        return values;
    };

    /** @type {SecretClient} */
    let client: SecretClient;
    /** @type {DefaultAzureCredential} */
    const credential = new DefaultAzureCredential();

    /**
     * Middleware function that retrieves secrets from Azure Key Vault and adds them to the request object.
     *
     * @param request - The request object.
     * @returns A promise that resolves when the middleware is complete.
     */
    const keyvaultSecretsMiddlewareBefore = async (
        request: AzureFunctionRequest,
    ): Promise<void> => {
        if (!client) {
            client = new SecretClient(options.vaultUrl, credential);
        }

        const { value } = processCache(request, options, fetch);
        if (value) {
            value.then((res: any) => {
                Object.assign(request.internal!, res);
            });
        }

        await getInternal(Object.keys(options.fetchData), request);
    };

    return {
        before: keyvaultSecretsMiddlewareBefore,
    };
};

export default keyvaultSecretsMiddleware;
export { keyvaultSecretsMiddleware };
export type {
    KeyVaultSecretsOptions,
    AzureFunctionRequest,
    KeyVaultSecretsMiddleware,
    CachedValues,
    FetchedValues,
};
