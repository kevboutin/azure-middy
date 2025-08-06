// @ts-ignore
import { normalizeHttpResponse } from "@kevboutin/azure-middy-util";
import {
    SecurityHeadersOptions,
    AzureFunctionRequest,
    SecurityHeadersMiddleware,
    ContentSecurityPolicy,
    ContentTypeOptions,
    CrossOriginEmbedderPolicy,
    CrossOriginOpenerPolicy,
    CrossOriginResourcePolicy,
    DnsPrefetchControl,
    DownloadOptions,
    FrameOptions,
    OriginAgentCluster,
    PermissionsPolicy,
    PermittedCrossDomainPolicies,
    PoweredBy,
    ReferrerPolicy,
    ReportTo,
    StrictTransportSecurity,
} from "./typings";

const defaults: SecurityHeadersOptions = {
    contentSecurityPolicy: {
        // Fetch directives
        // 'child-src': '', // fallback default-src
        // 'connect-src': '', // fallback default-src
        "default-src": "'none'",
        // 'font-src':'', // fallback default-src
        // 'frame-src':'', // fallback child-src > default-src
        // 'img-src':'', // fallback default-src
        // 'manifest-src':'', // fallback default-src
        // 'media-src':'', // fallback default-src
        // 'object-src':'', // fallback default-src
        // 'prefetch-src':'', // fallback default-src
        // 'script-src':'', // fallback default-src
        // 'script-src-elem':'', // fallback script-src > default-src
        // 'script-src-attr':'', // fallback script-src > default-src
        // 'style-src':'', // fallback default-src
        // 'style-src-elem':'', // fallback style-src > default-src
        // 'style-src-attr':'', // fallback style-src > default-src
        // 'worker-src':'', // fallback child-src > script-src > default-src
        // Document directives
        "base-uri": "'none'",
        sandbox: "",
        // Navigation directives
        "form-action": "'none'",
        "frame-ancestors": "'none'",
        "navigate-to": "'none'",
        // Reporting directives
        "report-to": "csp",
        // Other directives
        "require-trusted-types-for": "'script'",
        "trusted-types": "'none'",
        "upgrade-insecure-requests": "",
    },
    contentTypeOptions: {
        action: "nosniff",
    },
    crossOriginEmbedderPolicy: {
        policy: "require-corp",
    },
    crossOriginOpenerPolicy: {
        policy: "same-origin",
    },
    crossOriginResourcePolicy: {
        policy: "same-origin",
    },
    dnsPrefetchControl: {
        allow: false,
    },
    downloadOptions: {
        action: "noopen",
    },
    frameOptions: {
        action: "deny",
    },
    originAgentCluster: {},
    permissionsPolicy: {
        // Standard
        accelerometer: "",
        "ambient-light-sensor": "",
        autoplay: "",
        battery: "",
        camera: "",
        "cross-origin-isolated": "",
        "display-capture": "",
        "document-domain": "",
        "encrypted-media": "",
        "execution-while-not-rendered": "",
        "execution-while-out-of-viewport": "",
        fullscreen: "",
        geolocation: "",
        gyroscope: "",
        "keyboard-map": "",
        magnetometer: "",
        microphone: "",
        midi: "",
        "navigation-override": "",
        payment: "",
        "picture-in-picture": "",
        "publickey-credentials-get": "",
        "screen-wake-lock": "",
        "sync-xhr": "",
        usb: "",
        "web-share": "",
        "xr-spatial-tracking": "",
        // Proposed
        "clipboard-read": "",
        "clipboard-write": "",
        gamepad: "",
        "speaker-selection": "",
        // Experimental
        "conversion-measurement": "",
        "focus-without-user-activation": "",
        hid: "",
        "idle-detection": "",
        "interest-cohort": "",
        serial: "",
        "sync-script": "",
        "trust-token-redemption": "",
        "window-placement": "",
        "vertical-scroll": "",
    },
    permittedCrossDomainPolicies: {
        policy: "none", // none, master-only, by-content-type, by-ftp-filename, all
    },
    poweredBy: {
        server: "",
    },
    referrerPolicy: {
        policy: "no-referrer",
    },
    reportTo: {
        maxAge: 365 * 24 * 60 * 60,
        default: "",
        includeSubdomains: true,
        // Set this csp property to an actual endpoint URL that handles POST and logs
        csp: "",
        staple: "",
        xss: "",
    },
    strictTransportSecurity: {
        maxAge: 180 * 24 * 60 * 60,
        includeSubDomains: true,
        preload: true,
    },
};

interface HelmetFunctions {
    contentSecurityPolicy: (
        headers: Record<string, string>,
        config: ContentSecurityPolicy,
    ) => void;
    crossOriginEmbedderPolicy: (
        headers: Record<string, string>,
        config: CrossOriginEmbedderPolicy,
    ) => void;
    crossOriginOpenerPolicy: (
        headers: Record<string, string>,
        config: CrossOriginOpenerPolicy,
    ) => void;
    crossOriginResourcePolicy: (
        headers: Record<string, string>,
        config: CrossOriginResourcePolicy,
    ) => void;
    permissionsPolicy: (
        headers: Record<string, string>,
        config: PermissionsPolicy,
    ) => void;
    reportTo: (headers: Record<string, string>, config: ReportTo) => void;
    referrerPolicy: (
        headers: Record<string, string>,
        config: ReferrerPolicy,
    ) => void;
    strictTransportSecurity: (
        headers: Record<string, string>,
        config: StrictTransportSecurity,
    ) => void;
    contentTypeOptions: (
        headers: Record<string, string>,
        config: ContentTypeOptions,
    ) => void;
    dnsPrefetchControl: (
        headers: Record<string, string>,
        config: DnsPrefetchControl,
    ) => void;
    downloadOptions: (
        headers: Record<string, string>,
        config: DownloadOptions,
    ) => void;
    frameOptions: (
        headers: Record<string, string>,
        config: FrameOptions,
    ) => void;
    permittedCrossDomainPolicies: (
        headers: Record<string, string>,
        config: PermittedCrossDomainPolicies,
    ) => void;
    poweredBy: (headers: Record<string, string>, config: PoweredBy) => void;
}

const helmet: HelmetFunctions = {} as HelmetFunctions;
const helmetHtmlOnly: Partial<HelmetFunctions> = {};

// *** https://github.com/helmetjs/helmet/tree/main/middlewares *** //
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy
helmetHtmlOnly.contentSecurityPolicy = (
    headers: Record<string, string>,
    config: ContentSecurityPolicy,
): void => {
    let header = Object.keys(config)
        .map((policy) => (config[policy] ? `${policy} ${config[policy]}` : ""))
        .filter((str) => str)
        .join("; ");
    if (config.sandbox === "") {
        header += "; sandbox";
    }
    if (config["upgrade-insecure-requests"] === "") {
        header += "; upgrade-insecure-requests";
    }
    headers["Content-Security-Policy"] = header;
};

// crossdomain - N/A - for Adobe products
helmetHtmlOnly.crossOriginEmbedderPolicy = (
    headers: Record<string, string>,
    config: CrossOriginEmbedderPolicy,
): void => {
    headers["Cross-Origin-Embedder-Policy"] = config.policy;
};

helmetHtmlOnly.crossOriginOpenerPolicy = (
    headers: Record<string, string>,
    config: CrossOriginOpenerPolicy,
): void => {
    headers["Cross-Origin-Opener-Policy"] = config.policy;
};

helmetHtmlOnly.crossOriginResourcePolicy = (
    headers: Record<string, string>,
    config: CrossOriginResourcePolicy,
): void => {
    headers["Cross-Origin-Resource-Policy"] = config.policy;
};

// https://www.permissionspolicy.com/
helmetHtmlOnly.permissionsPolicy = (
    headers: Record<string, string>,
    config: PermissionsPolicy,
): void => {
    headers["Permissions-Policy"] = Object.keys(config)
        .map(
            (policy) =>
                `${policy}=${config[policy] === "*" ? "*" : "(" + config[policy] + ")"}`,
        )
        .join(", ");
};

helmetHtmlOnly.reportTo = (
    headers: Record<string, string>,
    config: ReportTo,
): void => {
    headers["Report-To"] = Object.keys(config)
        .map((group) => {
            const includeSubdomains =
                group === "default"
                    ? `, "include_subdomains": ${config.includeSubdomains}`
                    : "";
            return config[group as keyof ReportTo] &&
                group !== "includeSubdomains"
                ? `{ "group": "default", "max_age": ${config.maxAge}, "endpoints": [ { "url": "${config[group as keyof ReportTo]}" } ]${includeSubdomains} }`
                : "";
        })
        .filter((str) => str)
        .join(", ");
};

// https://github.com/helmetjs/referrer-policy
helmet.referrerPolicy = (
    headers: Record<string, string>,
    config: ReferrerPolicy,
): void => {
    headers["Referrer-Policy"] = config.policy;
};

// https://github.com/helmetjs/hsts
helmet.strictTransportSecurity = (
    headers: Record<string, string>,
    config: StrictTransportSecurity,
): void => {
    let header = "max-age=" + Math.round(config.maxAge);
    if (config.includeSubDomains) {
        header += "; includeSubDomains";
    }
    if (config.preload) {
        header += "; preload";
    }
    headers["Strict-Transport-Security"] = header;
};

// noCache - N/A - separate middleware

// X-* //
// https://github.com/helmetjs/dont-sniff-mimetype
helmet.contentTypeOptions = (
    headers: Record<string, string>,
    config: ContentTypeOptions,
): void => {
    headers["X-Content-Type-Options"] = config.action;
};

// https://github.com/helmetjs/dns-Prefetch-control
helmet.dnsPrefetchControl = (
    headers: Record<string, string>,
    config: DnsPrefetchControl,
): void => {
    headers["X-DNS-Prefetch-Control"] = config.allow ? "on" : "off";
};

// https://github.com/helmetjs/ienoopen
helmet.downloadOptions = (
    headers: Record<string, string>,
    config: DownloadOptions,
): void => {
    headers["X-Download-Options"] = config.action;
};

// https://github.com/helmetjs/frameOptions
helmetHtmlOnly.frameOptions = (
    headers: Record<string, string>,
    config: FrameOptions,
): void => {
    headers["X-Frame-Options"] = config.action.toUpperCase();
};

// https://github.com/helmetjs/crossdomain
helmet.permittedCrossDomainPolicies = (
    headers: Record<string, string>,
    config: PermittedCrossDomainPolicies,
): void => {
    headers["X-Permitted-Cross-Domain-Policies"] = config.policy;
};

// https://github.com/helmetjs/hide-powered-by
helmet.poweredBy = (
    headers: Record<string, string>,
    config: PoweredBy,
): void => {
    if (config.server) {
        headers["X-Powered-By"] = config.server;
    } else {
        delete headers["Server"];
        delete headers["X-Powered-By"];
    }
};

/**
 * Middleware function for adding security headers to the response.
 *
 * @param opts - Options for configuring the security headers.
 * @returns An object with 'after' and 'onError' properties, representing the middleware functions.
 */
const securityHeadersMiddleware = (
    opts: SecurityHeadersOptions = {},
): SecurityHeadersMiddleware => {
    const options: SecurityHeadersOptions = { ...defaults, ...opts };

    const securityHeadersMiddlewareAfter = async (
        request: AzureFunctionRequest,
    ): Promise<void> => {
        normalizeHttpResponse(request);

        Object.keys(helmet).forEach((key) => {
            if (!options[key as keyof SecurityHeadersOptions]) return;
            const config = {
                ...defaults[key as keyof SecurityHeadersOptions],
                ...options[key as keyof SecurityHeadersOptions],
            };
            helmet[key as keyof HelmetFunctions](
                request.response!.headers,
                config as any,
            );
        });

        if (request.response?.headers["Content-Type"]?.includes("text/html")) {
            Object.keys(helmetHtmlOnly).forEach((key) => {
                if (!options[key as keyof SecurityHeadersOptions]) return;
                const config = {
                    ...defaults[key as keyof SecurityHeadersOptions],
                    ...options[key as keyof SecurityHeadersOptions],
                };
                helmetHtmlOnly[key as keyof HelmetFunctions]!(
                    request.response!.headers,
                    config as any,
                );
            });
        }
    };

    const securityHeadersMiddlewareOnError = async (
        request: AzureFunctionRequest,
    ): Promise<void> => {
        if (request.response === undefined) {
            normalizeHttpResponse(request);
            return;
        }
        await securityHeadersMiddlewareAfter(request);
    };

    return {
        after: securityHeadersMiddlewareAfter,
        onError: securityHeadersMiddlewareOnError,
    };
};

export default securityHeadersMiddleware;
export { securityHeadersMiddleware };
export type {
    SecurityHeadersOptions,
    AzureFunctionRequest,
    SecurityHeadersMiddleware,
    ContentSecurityPolicy,
    ContentTypeOptions,
    CrossOriginEmbedderPolicy,
    CrossOriginOpenerPolicy,
    CrossOriginResourcePolicy,
    DnsPrefetchControl,
    DownloadOptions,
    FrameOptions,
    OriginAgentCluster,
    PermissionsPolicy,
    PermittedCrossDomainPolicies,
    PoweredBy,
    ReferrerPolicy,
    ReportTo,
    StrictTransportSecurity,
};
