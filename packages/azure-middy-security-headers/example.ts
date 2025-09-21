// Example TypeScript usage of the security headers middleware
import {
    securityHeadersMiddleware,
    SecurityHeadersOptions,
    ContentSecurityPolicy,
    StrictTransportSecurity,
} from "./index";
import type { AzureFunctionRequest } from "@kevboutin/azure-middy-types";

// Example handler with proper TypeScript types
const baseHandler = async (req: AzureFunctionRequest, context: any) => {
    return {
        body: JSON.stringify({ message: "Success" }),
        headers: {
            "Content-Type": "application/json",
        },
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
    } as StrictTransportSecurity,
    contentTypeOptions: {
        action: "nosniff",
    },
    frameOptions: {
        action: "deny",
    },
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin",
    },
    permissionsPolicy: {
        geolocation: "()",
        microphone: "()",
        camera: "()",
        payment: "()",
        usb: "()",
        magnetometer: "()",
        gyroscope: "()",
        accelerometer: "()",
        ambientLightSensor: "()",
        autoplay: "()",
        encryptedMedia: "()",
        fullscreen: "()",
        pictureInPicture: "()",
        syncXhr: "()",
    },
};

// Create middleware instance
const securityMiddleware = securityHeadersMiddleware(securityOptions);

// Example of using the middleware
const exampleRequest: AzureFunctionRequest = {
    response: {
        headers: {
            "Content-Type": "text/html",
        },
    },
    // ... other request properties
};

// This would typically be called by the middleware engine
// await securityMiddleware.after(exampleRequest);

console.log("TypeScript example loaded successfully");
