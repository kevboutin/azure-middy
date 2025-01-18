# azure-middy-keyvault-secrets

Azure Key Vault Secrets middleware for the azure-middy framework, the Node.js middleware engine for Azure functions.

## Install

To install the this middleware, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-keyvault-secrets
```

## Prerequisites

- Node.js >= 18
- An Azure Function App
- An Azure Key Vault instance
- Proper Azure credentials configured (using DefaultAzureCredential)

## Usage

The middleware provides Azure Key Vault secrets management for your Azure Functions:

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const {
    keyvaultSecretsMiddleware,
} = require("@kevboutin/azure-middy-keyvault-secrets");

// Your handler
const baseHandler = async (req, context) => {
    // Your business logic here
    // Secrets are available in req.internal
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Wrap handler with middy
const handler = middy(baseHandler).use(
    keyvaultSecretsMiddleware({
        vaultUrl: "https://your-vault.vault.azure.net",
        fetchData: {
            apiKey: "api-key-secret-name",
            dbPassword: "db-password-secret-name",
        },
        cacheExpiry: 300000, // Cache for 5 minutes (optional)
    }),
);

module.exports = { handler };

app.http("yourFunction", {
    route: "your-route",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

## API

### keyvaultSecretsMiddleware(opts = {})

Creates a middleware instance with the following options:

- `opts.vaultUrl` (required): The URL of your Azure Key Vault (e.g., "https://your-vault.vault.azure.net")
- `opts.fetchData` (required): Object mapping of local names to Key Vault secret names
- `opts.cacheKey` (optional): Custom cache key for storing secrets (default: "secrets")
- `opts.cacheExpiry` (optional): How long to cache secrets in milliseconds (default: 0, no cache)

## Authentication

The middleware uses `DefaultAzureCredential` from `@azure/identity` which supports multiple authentication methods:

1. Environment variables (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)
2. Managed Identity
3. Visual Studio Code credentials
4. Azure CLI credentials
5. Interactive browser login

For production, we recommend using Managed Identity or service principal credentials.

## Caching

The middleware supports caching of secrets to reduce Key Vault API calls:

- Set `cacheExpiry` to the number of milliseconds to cache secrets
- Use `cacheKey` to specify a custom cache key if needed
- Cache is automatically invalidated after expiry
- Set `cacheExpiry: 0` to disable caching

## Security Considerations

1. Always use RBAC or Access Policies to limit Key Vault access
2. Consider enabling Key Vault soft-delete and purge protection
3. Monitor Key Vault access using Azure Monitor
4. Regularly rotate secrets
5. Use Managed Identity when possible

## Documentation and examples

For more documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
