"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const helloMiddy_1 = require("./functions/helloMiddy");
functions_1.app.http("helloMiddy", {
    route: "hello",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: helloMiddy_1.helloMiddy,
});
