// Example TypeScript usage of the Key Vault secrets middleware
import { keyvaultSecretsMiddleware, KeyVaultSecretsOptions } from "./index";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

// Example handler with proper TypeScript types
const baseHandler = async (req: AzureFunctionRequest, context: any) => {
    // Access secrets from the request internal object
    const internal = req.internal as {
        [key: string]: unknown;
        "database-connection"?: string;
        "api-key"?: string;
        "jwt-secret"?: string;
    };

    const databaseConnectionString = internal["database-connection"];
    const apiKey = internal["api-key"];
    const jwtSecret = internal["jwt-secret"];

    console.log("Retrieved secrets:", {
        hasDatabaseConnection: !!databaseConnectionString,
        hasApiKey: !!apiKey,
        hasJwtSecret: !!jwtSecret,
    });

    return {
        body: JSON.stringify({
            message: "Success",
            hasSecrets: !!databaseConnectionString,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    };
};

// Configure Key Vault options with TypeScript
const keyVaultOptions: KeyVaultSecretsOptions = {
    cacheKey: "my-secrets",
    vaultUrl: "https://my-keyvault.vault.azure.net/",
    fetchData: {
        "database-connection": "database-connection-string",
        "api-key": "api-key-secret",
        "jwt-secret": "jwt-signing-key",
        "redis-connection": "redis-connection-string",
    },
};

// Create middleware instance
const secretsMiddleware = keyvaultSecretsMiddleware(keyVaultOptions);

// Example of using the middleware
const exampleRequest: AzureFunctionRequest = {
    internal: {},
    // ... other request properties
} as unknown as AzureFunctionRequest;

// This would typically be called by the middleware engine
// await secretsMiddleware.before(exampleRequest);

console.log("TypeScript example loaded successfully");
