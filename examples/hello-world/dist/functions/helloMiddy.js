"use strict";
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (
                  !desc ||
                  ("get" in desc
                      ? !m.__esModule
                      : desc.writable || desc.configurable)
              ) {
                  desc = {
                      enumerable: true,
                      get: function () {
                          return m[k];
                      },
                  };
              }
              Object.defineProperty(o, k2, desc);
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k;
              o[k2] = m[k];
          });
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, "default", {
                  enumerable: true,
                  value: v,
              });
          }
        : function (o, v) {
              o["default"] = v;
          });
var __importStar =
    (this && this.__importStar) ||
    (function () {
        var ownKeys = function (o) {
            ownKeys =
                Object.getOwnPropertyNames ||
                function (o) {
                    var ar = [];
                    for (var k in o)
                        if (Object.prototype.hasOwnProperty.call(o, k))
                            ar[ar.length] = k;
                    return ar;
                };
            return ownKeys(o);
        };
        return function (mod) {
            if (mod && mod.__esModule) return mod;
            var result = {};
            if (mod != null)
                for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                    if (k[i] !== "default") __createBinding(result, mod, k[i]);
            __setModuleDefault(result, mod);
            return result;
        };
    })();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Hello middy module that is a simple example using the Azure functions v4 programming model.
 *
 * @module helloMiddy
 * @see module:helloMiddy
 * @author Kevin Boutin <kevboutin@gmail.com>
 */
const functions_1 = require("@azure/functions");
const middy = __importStar(require("@kevboutin/azure-middy-core"));
const loggerMiddleware = __importStar(require("@kevboutin/azure-middy-logger"));
const TAG = "hello-middy";
const headers = new Headers({
    "Content-Type": "application/json",
});
/**
 * Handles a request and generates an appropriate response.
 *
 * @param {HttpRequest} req The request object containing information about the incoming request.
 * @param {InvocationContext} context The context object containing information about the current execution context.
 * @returns {HttpResponseInit} The response.
 */
const baseHandler = async (req, context) => {
    if (!req) {
        console.error(`${TAG}: Request object is undefined.`);
        return {
            status: 400,
            headers,
            jsonBody: {
                result: "failure",
                message: "Request object is missing.",
            },
        };
    }
    console.log(
        `${TAG}: Function ${context.functionName} has been called with ${req.method} to ${req.url}`,
    );
    let queryParams = {};
    // Azure v4 functions need to use the following to get the body.
    let requestBody = {};
    try {
        requestBody = await req.json();
    } catch (e) {
        requestBody = {};
    }
    console.log(`${TAG}: requestBody=${JSON.stringify(requestBody)}`);
    // Azure v4 functions use URLSearchParams for query parameters.
    if (req.query instanceof URLSearchParams) {
        queryParams = Object.fromEntries(req.query.entries());
    }
    // Query parameters are used if using a GET request; alternatively, the request body is used for a POST request.
    if (queryParams.name || requestBody.name) {
        const name = queryParams.name || requestBody.name;
        const msg = `Hello middy! This is from ${name}.`;
        console.log(`${TAG}: ${msg}`);
        return {
            status: 200,
            headers,
            jsonBody: {
                result: "success",
                message: msg,
            },
        };
    }
    console.error(
        `${TAG}: Name attribute was not provided in the query or body.`,
    );
    return {
        status: 400,
        headers,
        jsonBody: {
            result: "failure",
            message:
                "Please provide a name as a query parameter as a get or in the body of the request as a post.",
        },
    };
};
const helloMiddy = middy(baseHandler).use(loggerMiddleware());
module.exports = helloMiddy;
functions_1.app.http("helloMiddy", {
    route: "middy",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: helloMiddy,
});
