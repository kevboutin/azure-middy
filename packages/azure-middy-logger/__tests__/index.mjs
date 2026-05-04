import { test, expect, beforeEach, afterEach } from "vitest";
import sinon from "sinon";
import interceptor from "azure-function-log-intercept";

let sandbox;
beforeEach(async () => {
    sandbox = sinon.createSandbox();
});

afterEach(async () => {
    sandbox.restore();
});

test("interceptor intercepts all methods", () => {
    let x = 0;
    const context = {
        log() {
            x++;
        },
    };
    context.log.warn =
        context.log.info =
        context.log.error =
            () => {
                x++;
            };

    interceptor(context);

    console.log("intercepted");
    console.warn("intercepted");
    console.info("intercepted");
    console.error("intercepted");

    expect(x).toBe(4);
});
