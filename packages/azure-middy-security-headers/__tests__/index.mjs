import { test, expect } from "vitest";
import middy from "../../azure-middy-core/dist/index.js";
import securityHeadersMiddleware from "../dist/index.js";

const req = {};
const defaultContext = {
    getRemainingTimeInMillis: () => 1000,
};

const createDefaultObjectResponse = () => ({
    statusCode: 200,
    body: { firstname: "john", lastname: "doe" },
});

const createHtmlObjectResponse = () => ({
    statusCode: 200,
    body: "<html></html>",
    headers: {
        "Content-Type": "text/html; charset=utf-8",
    },
});

const createHeaderObjectResponse = () => ({
    statusCode: 200,
    body: { firstname: "john", lastname: "doe" },
    headers: {
        Server: "azure",
        "X-Powered-By": "azure-middy",
    },
});

const createArrayResponse = () => [{ firstname: "john", lastname: "doe" }];

test("It should return default security headers", async () => {
    const handler = middy(() => createDefaultObjectResponse());

    handler.use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);
    expect(response.statusCode).toBe(200);

    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers.Server).toBeUndefined();
    expect(response.headers["Strict-Transport-Security"]).toBe(
        "max-age=15552000; includeSubDomains; preload",
    );
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["X-DNS-Prefetch-Control"]).toBe("off");
    expect(response.headers["X-Download-Options"]).toBe("noopen");
    expect(response.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(response.headers["X-Powered-By"]).toBeUndefined();
    expect(response.headers["X-Frame-Options"]).toBeUndefined();
    expect(response.headers["X-XSS-Protection"]).toBeUndefined();
});

test("It should return default security headers when HTML", async () => {
    const handler = middy(() => createHtmlObjectResponse());

    handler.use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);

    expect(response.headers["Content-Security-Policy"]).toBe(
        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; navigate-to 'none'; report-to csp; require-trusted-types-for 'script'; trusted-types 'none'; sandbox; upgrade-insecure-requests",
    );
    expect(response.headers["Cross-Origin-Embedder-Policy"]).toBe(
        "require-corp",
    );
    expect(response.headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(response.headers["Cross-Origin-Resource-Policy"]).toBe(
        "same-origin",
    );
    expect(response.headers["Permissions-Policy"]).toBe(
        "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), speaker-selection=(), conversion-measurement=(), focus-without-user-activation=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), sync-script=(), trust-token-redemption=(), window-placement=(), vertical-scroll=()",
    );
    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers.Server).toBeUndefined();
    expect(response.headers["Strict-Transport-Security"]).toBe(
        "max-age=15552000; includeSubDomains; preload",
    );
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["X-DNS-Prefetch-Control"]).toBe("off");
    expect(response.headers["X-Download-Options"]).toBe("noopen");
    expect(response.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(response.headers["X-Powered-By"]).toBeUndefined();
    expect(response.headers["X-Frame-Options"]).toBe("DENY");
});

test("It should modify default security headers", async () => {
    const handler = middy(() => createHeaderObjectResponse());

    handler.use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);

    expect(response.statusCode).toBe(200);
    expect(response.headers.Server).toBeUndefined();
    expect(response.headers["X-Powered-By"]).toBeUndefined();
});

test("It should modify default security headers with config set", async () => {
    const handler = middy(() => createHtmlObjectResponse());

    handler.use(
        securityHeadersMiddleware({
            contentSecurityPolicy: false,
            dnsPrefetchControl: {
                allow: true,
            },
            referrerPolicy: undefined,
            strictTransportSecurity: {
                includeSubDomains: false,
                preload: false,
            },
            poweredBy: {
                server: "Other",
            },
            permissionsPolicy: {
                accelerometer: "*",
            },
            permittedCrossDomainPolicies: {
                policy: "all",
            },
            reportTo: {
                default: "https://example.report-uri.com/a/d/g",
            },
        }),
    );

    const response = await handler(defaultContext, req);

    expect(response.statusCode).toBe(200);

    expect(response.headers["Content-Security-Policy"]).toBeUndefined();
    expect(response.headers["Referrer-Policy"]).toBeUndefined();
    expect(response.headers["Report-To"]).toBe(
        '{ "group": "default", "max_age": 31536000, "endpoints": [ { "url": "31536000" } ] }, { "group": "default", "max_age": 31536000, "endpoints": [ { "url": "https://example.report-uri.com/a/d/g" } ], "include_subdomains": true }',
    );
    expect(response.headers["Permissions-Policy"]).toBe(
        "accelerometer=*, ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=(), clipboard-read=(), clipboard-write=(), gamepad=(), speaker-selection=(), conversion-measurement=(), focus-without-user-activation=(), hid=(), idle-detection=(), interest-cohort=(), serial=(), sync-script=(), trust-token-redemption=(), window-placement=(), vertical-scroll=()",
    );
    expect(response.headers["Strict-Transport-Security"]).toBe(
        "max-age=15552000",
    );
    expect(response.headers["X-DNS-Prefetch-Control"]).toBe("on");
    expect(response.headers["X-Permitted-Cross-Domain-Policies"]).toBe("all");
    expect(response.headers["X-Powered-By"]).toBe("Other");
});

test("It should support array responses", async () => {
    const handler = middy(() => createArrayResponse());

    handler.use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);

    expect(response.body).toEqual([{ firstname: "john", lastname: "doe" }]);
    expect(response.statusCode).toBe(200);
    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers["Strict-Transport-Security"]).toBe(
        "max-age=15552000; includeSubDomains; preload",
    );
    expect(response.headers["X-DNS-Prefetch-Control"]).toBe("off");
    expect(response.headers["X-Powered-By"]).toBeUndefined();
    expect(response.headers["X-Download-Options"]).toBe("noopen");
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(response.headers["X-Frame-Options"]).toBeUndefined();
});

test("It should skip onError if error has not been handled", async () => {
    const handler = middy(() => {
        throw new Error("error");
    });

    handler
        .onError((request) => {
            expect(request.response).toBeUndefined();
        })
        .use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);
    expect(response.statusCode).toBe(500);
});

test("It should apply security headers if error is handled", async () => {
    const handler = middy(() => {
        throw new Error("error");
    });

    handler
        .onError((request) => {
            request.response = { headers: {} };
        })
        .use(securityHeadersMiddleware());

    const response = await handler(defaultContext, req);
    expect(response.statusCode).toBe(500);

    expect(response.headers["Referrer-Policy"]).toBe("no-referrer");
    expect(response.headers.Server).toBeUndefined();
    expect(response.headers["Strict-Transport-Security"]).toBe(
        "max-age=15552000; includeSubDomains; preload",
    );
    expect(response.headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(response.headers["X-DNS-Prefetch-Control"]).toBe("off");
    expect(response.headers["X-Download-Options"]).toBe("noopen");
    expect(response.headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
    expect(response.headers["X-Powered-By"]).toBeUndefined();
    expect(response.headers["X-Frame-Options"]).toBeUndefined();
});
