export interface ContentSecurityPolicy {
    "default-src"?: string;
    "child-src"?: string;
    "connect-src"?: string;
    "font-src"?: string;
    "frame-src"?: string;
    "img-src"?: string;
    "manifest-src"?: string;
    "media-src"?: string;
    "object-src"?: string;
    "prefetch-src"?: string;
    "script-src"?: string;
    "script-src-elem"?: string;
    "script-src-attr"?: string;
    "style-src"?: string;
    "style-src-elem"?: string;
    "style-src-attr"?: string;
    "worker-src"?: string;
    "base-uri"?: string;
    sandbox?: string;
    "form-action"?: string;
    "frame-ancestors"?: string;
    "navigate-to"?: string;
    "report-to"?: string;
    "require-trusted-types-for"?: string;
    "trusted-types"?: string;
    "upgrade-insecure-requests"?: string;
    [key: string]: string | undefined;
}

export interface ContentTypeOptions {
    action: string;
}

export interface CrossOriginEmbedderPolicy {
    policy: string;
}

export interface CrossOriginOpenerPolicy {
    policy: string;
}

export interface CrossOriginResourcePolicy {
    policy: string;
}

export interface DnsPrefetchControl {
    allow: boolean;
}

export interface DownloadOptions {
    action: string;
}

export interface FrameOptions {
    action: string;
}

export interface OriginAgentCluster {
    [key: string]: any;
}

export interface PermissionsPolicy {
    accelerometer?: string;
    "ambient-light-sensor"?: string;
    autoplay?: string;
    battery?: string;
    camera?: string;
    "cross-origin-isolated"?: string;
    "display-capture"?: string;
    "document-domain"?: string;
    "encrypted-media"?: string;
    "execution-while-not-rendered"?: string;
    "execution-while-out-of-viewport"?: string;
    fullscreen?: string;
    geolocation?: string;
    gyroscope?: string;
    "keyboard-map"?: string;
    magnetometer?: string;
    microphone?: string;
    midi?: string;
    "navigation-override"?: string;
    payment?: string;
    "picture-in-picture"?: string;
    "publickey-credentials-get"?: string;
    "screen-wake-lock"?: string;
    "sync-xhr"?: string;
    usb?: string;
    "web-share"?: string;
    "xr-spatial-tracking"?: string;
    "clipboard-read"?: string;
    "clipboard-write"?: string;
    gamepad?: string;
    "speaker-selection"?: string;
    "conversion-measurement"?: string;
    "focus-without-user-activation"?: string;
    hid?: string;
    "idle-detection"?: string;
    "interest-cohort"?: string;
    serial?: string;
    "sync-script"?: string;
    "trust-token-redemption"?: string;
    "window-placement"?: string;
    "vertical-scroll"?: string;
    [key: string]: string | undefined;
}

export interface PermittedCrossDomainPolicies {
    policy: string;
}

export interface PoweredBy {
    server: string;
}

export interface ReferrerPolicy {
    policy: string;
}

export interface ReportTo {
    maxAge: number;
    default: string;
    includeSubdomains: boolean;
    csp: string;
    staple: string;
    xss: string;
}

export interface StrictTransportSecurity {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
}

export interface SecurityHeadersOptions {
    readonly contentSecurityPolicy?: ContentSecurityPolicy;
    readonly contentTypeOptions?: ContentTypeOptions;
    readonly crossOriginEmbedderPolicy?: CrossOriginEmbedderPolicy;
    readonly crossOriginOpenerPolicy?: CrossOriginOpenerPolicy;
    readonly crossOriginResourcePolicy?: CrossOriginResourcePolicy;
    readonly dnsPrefetchControl?: DnsPrefetchControl;
    readonly downloadOptions?: DownloadOptions;
    readonly frameOptions?: FrameOptions;
    readonly originAgentCluster?: OriginAgentCluster;
    readonly permissionsPolicy?: PermissionsPolicy;
    readonly permittedCrossDomainPolicies?: PermittedCrossDomainPolicies;
    readonly poweredBy?: PoweredBy;
    readonly referrerPolicy?: ReferrerPolicy;
    readonly reportTo?: ReportTo;
    readonly strictTransportSecurity?: StrictTransportSecurity;
}

export interface AzureFunctionRequest {
    response?: {
        readonly headers: Record<string, string>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface SecurityHeadersMiddleware {
    after: (request: AzureFunctionRequest) => Promise<void>;
    onError: (request: AzureFunctionRequest) => Promise<void>;
}

export type SecurityHeadersMiddlewareFunction = (
    opts?: SecurityHeadersOptions,
) => SecurityHeadersMiddleware;

// Declare module for dependencies
declare module "@kevboutin/azure-middy-util" {
    export function normalizeHttpResponse(request: any): void;
}
