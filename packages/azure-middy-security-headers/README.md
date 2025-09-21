# azure-middy-security-headers

Security Headers middleware for the azure-middy framework, the Node.js middleware engine for Azure functions.

## Install

To install the Security Headers middleware, you can use NPM:

```bash
npm install --save @kevboutin/azure-middy-security-headers
```

## Prerequisites

- Node.js >= 18
- An Azure Function App

## Usage

The middleware adds security headers to your HTTP responses.

### JavaScript (CommonJS)

```javascript
const { app } = require("@azure/functions");
const middy = require("@kevboutin/azure-middy-core");
const securityHeadersMiddleware = require("@kevboutin/azure-middy-security-headers");

// Your handler
const baseHandler = async (req, context) => {
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Wrap handler with middy
const handler = middy(baseHandler).use(
    securityHeadersMiddleware({
        contentSecurityPolicy: {
            "default-src": "'self'",
            "script-src": "'self' 'unsafe-inline'",
            "style-src": "'self' 'unsafe-inline'",
        },
        referrerPolicy: {
            policy: "strict-origin-when-cross-origin",
        },
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

### TypeScript

```typescript
import { app } from "@azure/functions";
import middy from "@kevboutin/azure-middy-core";
import {
    securityHeadersMiddleware,
    SecurityHeadersOptions,
    ContentSecurityPolicy,
} from "@kevboutin/azure-middy-security-headers";

// Your handler
const baseHandler = async (req: any, context: any) => {
    return {
        body: JSON.stringify({ message: "Success" }),
    };
};

// Configure security headers with TypeScript
const securityOptions: SecurityHeadersOptions = {
    contentSecurityPolicy: {
        "default-src": "'self'",
        "script-src": "'self' 'unsafe-inline'",
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' data: https:",
        "connect-src": "'self'",
        "font-src": "'self'",
        "object-src": "'none'",
        "media-src": "'self'",
        "frame-src": "'none'",
    } as ContentSecurityPolicy,
    strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    contentTypeOptions: {
        action: "nosniff",
    },
    frameOptions: {
        action: "deny",
    },
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
    },
};

// Wrap handler with middy
const handler = middy(baseHandler).use(
    securityHeadersMiddleware(securityOptions),
);

export { handler };

app.http("yourFunction", {
    route: "your-route",
    methods: ["GET"],
    authLevel: "anonymous",
    handler: handler,
});
```

## Default Security Headers

When used without configuration, the middleware adds these security headers:

```json
{
    "Content-Security-Policy": "default-src 'none'",
    "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Permitted-Cross-Domain-Policies": "none",
    "X-XSS-Protection": "0"
}
```

## API

### securityHeadersMiddleware(opts = {})

Creates a middleware instance with the following configurable options:

#### Content Security Policy

##### Source List Reference

All of the directives that end with `-src` support similar values known as a source list. Multiple source list values can be space separated with the exception of `'none'` which should be the only value.

| Source Value       | Example                                    | Description                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| \*                 | img-src \*                                 | Wildcard, allows any URL except data: blob: filesystem: schemes.                                                                                                                                                                                         |
| 'none'             | object-src 'none'                          | Prevents loading resources from any source.                                                                                                                                                                                                              |
| 'self'             | script-src 'self'                          | Allows loading resources from the same origin (same scheme, host and port).                                                                                                                                                                              |
| data:              | img-src 'self' data:                       | Allows loading resources via the data scheme (eg Base64 encoded images).                                                                                                                                                                                 |
| domain.example.com | img-src domain.example.com                 | Allows loading resources from the specified domain name.                                                                                                                                                                                                 |
| \*.example.com     | img-src \*.example.com                     | Allows loading resources from any subdomain under example.com.                                                                                                                                                                                           |
| https://cdn.com    | img-src https://cdn.com                    | Allows loading resources only over HTTPS matching the given domain.                                                                                                                                                                                      |
| https:             | img-src https:                             | Allows loading resources only over HTTPS on any domain.                                                                                                                                                                                                  |
| 'unsafe-inline'    | script-src 'unsafe-inline'                 | Allows use of inline source elements such as style attribute, onclick, or script tag bodies (depends on the context of the source it is applied to) and javascript: URIs                                                                                 |
| 'unsafe-eval'      | script-src 'unsafe-eval'                   | Allows unsafe dynamic code evaluation such as JavaScript eval()                                                                                                                                                                                          |
| 'sha256-'          | script-src 'sha256-xyz...'                 | Allows an inline script or CSS to execute if its hash matches the specified hash in the header. Currently supports SHA256, SHA384 or SHA512. CSP Level 2                                                                                                 |
| 'nonce-'           | script-src 'nonce-rAnd0m'                  | Allows an inline script or CSS to execute if the script tag (eg: `<script nonce="rAnd0m">`) contains a nonce attribute matching the nonce specified in the CSP header. The nonce should be a secure random string, and should not be reused. CSP Level 2 |
| 'strict-dynamic'   | script-src 'strict-dynamic'                | Enables an allowed script to load additional scripts via non-"parser-inserted" script elements (for example `document.createElement('script');` is allowed). CSP Level 3                                                                                 |
| 'unsafe-hashes'    | script-src 'unsafe-hashes' 'sha256-abc...' | Allows you to enable scripts in event handlers (eg `onclick`). Does not apply to `javascript:` or inline `<script>` CSP Level 3                                                                                                                          |

```json
contentSecurityPolicy: {
    directives: {
        "base-uri": "'none'", // Defines a set of allowed URLs which can be used in the src attribute of a HTML base tag.
        "child-src": "'none'", // Defines valid sources for web workers and nested browsing contexts loaded using elements such as <frame> and <iframe>
        "connect-src": "'self'", // Applies to XMLHttpRequest (AJAX), WebSocket, fetch(), <a ping> or EventSource. If not allowed the browser emulates a 400 HTTP status code.
        "default-src": "'self'", // Defines the default policy for fetching resources such as JavaScript, Images, CSS, Fonts, AJAX requests, Frames, HTML5 Media. Not all directives fallback to default-src but many do.
        "font-src": "'self'", // Defines valid sources of font resources (loaded via @font-face).
        "form-action": "'self'", // Defines valid sources that can be used as an HTML <form> action.
        "frame-ancestors": "'none'", // Defines valid sources for embedding the resource using <frame> <iframe> <object> <embed> <applet>. Setting this directive to 'none' should be roughly equivalent to X-Frame-Options: DENY
        "frame-src": "'none'", // Defines valid sources for loading frames. In CSP Level 2 frame-src was deprecated in favor of the child-src directive. CSP Level 3, has undeprecated frame-src and it will continue to defer to child-src if not present.
        "img-src": "'self'", // Defines valid sources of images.
        "manifest-src": "'self'", // Restricts the URLs that application manifests can be loaded.
        "media-src": "'self'", // Defines valid sources of audio and video, eg HTML5 <audio>, <video> elements.
        "navigate-to": "'none'", // Restricts the URLs that the document may navigate to by any means. For example when a link is clicked, a form is submitted, or window.location is invoked. If form-action is present then this directive is ignored for form submissions. Removed from the CSP 3 Spec.
        "object-src": "'none'", // Defines valid sources of plugins, eg <object>, <embed> or <applet>.
        "plugin-types": "application/pdf", // Defines valid MIME types for plugins invoked via <object> and <embed>. To load an <applet> you must specify application/x-java-applet.
        "prefetch-src": "'none'", // Defines valid sources for request prefetch and prerendering, for example via the link tag with rel="prefetch" or rel="prerender".
        "report-to": "csp", // Defines a reporting group name defined by a Report-To HTTP response header. See the Reporting API for more info.
        "report-uri": "/report-violation", // Instructs the browser to POST reports of policy failures to this URI. You can also use Content-Security-Policy-Report-Only as the HTTP header name to instruct the browser to only send reports (does not block anything). This directive is deprecated in CSP Level 3 in favor of the report-to directive.
        "sandbox": ["allow-forms" "allow-scripts"], // Enables a sandbox for the requested resource similar to the iframe sandbox attribute. The sandbox applies a same origin policy, prevents popups, plugins and script execution is blocked. You can keep the sandbox value empty to keep all restrictions in place, or add flags: allow-forms allow-same-origin allow-scripts allow-popups, allow-modals, allow-orientation-lock, allow-pointer-lock, allow-presentation, allow-popups-to-escape-sandbox, and allow-top-navigation
        "script-src": "'self'", // Defines valid sources of JavaScript.
        "style-src": "'self'", // Defines valid sources of stylesheets or CSS.
        "worker-src": "'self'" // Restricts the URLs which may be loaded as a Worker, SharedWorker or ServiceWorker.
    }
}
```

#### HSTS (HTTP Strict Transport Security)

```json
strictTransportSecurity: {
    maxAge: 15552000,
    includeSubDomains: true,
    preload: false
}
```

#### Referrer Policy

```json
referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
}
```

#### Frame Options

```json
frameOptions: {
    action: "SAMEORIGIN" // DENY, SAMEORIGIN, or ALLOW-FROM
}
```

#### Other Headers

```json
nosniff: true, // X-Content-Type-Options
dnsPrefetchControl: { allow: false }, // X-DNS-Prefetch-Control
downloadOptions: { noopen: true }, // X-Download-Options
permittedCrossDomainPolicies: { policy: "none" }, // X-Permitted-Cross-Domain-Policies
xssFilter: { setOnOldIE: true } // X-XSS-Protection
```

## TypeScript Support

This package includes full TypeScript support with:

- **Type Definitions**: Complete type definitions for all security header options and interfaces
- **Type Safety**: Full type checking for middleware options and request objects
- **IntelliSense**: Enhanced IDE support with autocomplete and type hints

### Available Types

```typescript
import {
    SecurityHeadersOptions,
    SecurityHeadersMiddleware,
    ContentSecurityPolicy,
    StrictTransportSecurity,
    ReferrerPolicy,
    FrameOptions,
    PermissionsPolicy,
} from "@kevboutin/azure-middy-security-headers";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";
```

### TypeScript Configuration

To use TypeScript with this package, ensure your `tsconfig.json` includes:

```json
{
    "compilerOptions": {
        "esModuleInterop": true,
        "moduleResolution": "node"
    }
}
```

## Security Best Practices

1. Always enable HTTPS in production
2. Configure Content Security Policy based on your application's needs
3. Use strict HSTS settings in production
4. Regularly review and update security headers
5. Test headers using security scanning tools
6. Monitor for security header violations

## Documentation and examples

For more documentation and examples, refer to the main [Azure-middy monorepo on GitHub](https://github.com/kevboutin/azure-middy).

## Contributing

Everyone is very welcome to contribute to this repository. Feel free to [raise issues](https://github.com/kevboutin/azure-middy/issues) or to [submit Pull Requests](https://github.com/kevboutin/azure-middy/pulls).

## License

Licensed under [MIT License](LICENSE). Copyright (c) 2024 Kevin Boutin and the [Azure-Middy team](https://github.com/kevboutin/azure-middy/graphs/contributors).
