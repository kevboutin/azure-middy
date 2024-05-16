const test = require("ava");
const sinon = require("sinon");
const interceptor = require("azure-function-log-intercept");

let sandbox;
test.beforeEach(async (t) => {
    sandbox = sinon.createSandbox();
});

test.afterEach(async (t) => {
    sandbox.restore();
});

test("interceptor intercepts all methods", (t) => {
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

    t.is(x, 4);
});
