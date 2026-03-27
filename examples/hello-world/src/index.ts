import { app } from "@azure/functions";
import { helloMiddy } from "./functions/helloMiddy";

app.http("helloMiddy", {
    route: "hello",
    methods: ["GET", "POST"],
    authLevel: "anonymous",
    handler: helloMiddy,
});
