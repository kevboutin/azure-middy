import { test, expect } from 'vitest';
import sinon from "sinon";
import middy from "../dist/index.js";

test('Middleware attached with "use" must be an object or array[object]', async () => {
    const handler = middy();

    expect(() => {
        handler.use(() => {});
    }).toThrow(
        'Middleware must be an object containing at least one key among "before", "after", "onError"',
    );

    expect(() => {
        handler.use({ foo: "bar" });
    }).toThrow(
        'Middleware must be an object containing at least one key among "before", "after", "onError"',
    );

    expect(() => {
        handler.use(["before"]);
    }).toThrow(
        'Middleware must be an object containing at least one key among "before", "after", "onError"',
    );
});

test('"use" can add single before middleware', async () => {
    const handler = middy();
    const before = () => {};
    const middleware = () => ({ before });
    handler.use(middleware());
    expect(handler.__middlewares.before[0]).toBe(before);
});

test('"use" can add single after middleware', async () => {
    const handler = middy();
    const after = () => {};
    const middleware = () => ({ after });
    handler.use(middleware());
    expect(handler.__middlewares.after[0]).toBe(after);
});

test('"use" can add single onError middleware', async () => {
    const handler = middy();
    const onError = () => {};
    const middleware = () => ({ onError });
    handler.use(middleware());
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test('"use" can add single object with all types of middlewares', async () => {
    const handler = middy();
    const before = () => {};
    const after = () => {};
    const onError = () => {};
    const middleware = () => ({ before, after, onError });
    handler.use(middleware());
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test('"use" can add multiple before middleware', async () => {
    const handler = middy();
    const before = () => {};
    const middleware = () => ({ before });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.before[1]).toBe(before);
});

test('"use" can add multiple after middleware', async () => {
    const handler = middy();
    const after = () => {};
    const middleware = () => ({ after });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.after[1]).toBe(after);
});

test('"use" can add multiple onError middleware', async () => {
    const handler = middy();
    const onError = () => {};
    const middleware = () => ({ onError });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.onError[0]).toBe(onError);
    expect(handler.__middlewares.onError[1]).toBe(onError);
});

test('"use" can add multiple object with all types of middlewares', async () => {
    const handler = middy();
    const before = () => {};
    const after = () => {};
    const onError = () => {};
    const middleware = () => ({ before, after, onError });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.onError[0]).toBe(onError);
    expect(handler.__middlewares.before[1]).toBe(before);
    expect(handler.__middlewares.after[1]).toBe(after);
    expect(handler.__middlewares.onError[1]).toBe(onError);
});

test('"before" should add a before middleware', async () => {
    const handler = middy();
    const before = () => {};

    handler.before(before);
    expect(handler.__middlewares.before[0]).toBe(before);
});

test('"after" should add a before middleware', async () => {
    const handler = middy();
    const after = () => {};

    handler.after(after);
    expect(handler.__middlewares.after[0]).toBe(after);
});

test('"onError" should add a before middleware', async () => {
    const handler = middy();
    const onError = () => {};

    handler.onError(onError);
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test("It should execute before and after middlewares in the right order", async () => {
    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const executedBefore = [];
    const executedAfter = [];
    const m1 = () => ({
        before: () => {
            executedBefore.push("m1");
        },
        after: () => {
            executedAfter.push("m1");
        },
    });

    const m2 = () => ({
        before: () => {
            executedBefore.push("m2");
        },
        after: () => {
            executedAfter.push("m2");
        },
    });

    handler.use(m1()).use(m2());

    // executes the handler
    const response = await handler();
    expect(executedBefore).toEqual(["m1", "m2"]);
    expect(executedAfter).toEqual(["m2", "m1"]);
    expect(response).toEqual({ foo: "bar" });
});

test('"before" middlewares should be able to change context', async () => {
    let handlerContext;
    const handler = middy((req, context) => {
        handlerContext = context;
        return { foo: "bar" };
    });

    const changeContextMiddleware = (request) => {
        request.context.modified = true;
    };

    handler.before(changeContextMiddleware);

    await handler();
    expect(handlerContext.modified).toBe(true);
});

test('"before" middleware should be able to modify context', async () => {
    const handler = middy((req, context) => {
        expect(req.modifiedSpread).toBe(true);
        expect(req.modifiedAssign).toBe(true);
        return { foo: "bar" };
    });

    const getFunctionContext = (request) => {
        request.req = {
            ...request.req,
            modifiedSpread: true,
        };
        Object.assign(request.req, { modifiedAssign: true });
    };

    handler.before(getFunctionContext);

    await handler();
});

test('"after" middlewares should be able to change response', async () => {
    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const changeResponseMiddleware = (request) => {
        request.response.modified = true;
    };

    handler.after(changeResponseMiddleware);

    const response = await handler();
    expect(response.modified).toBe(true);
});

test('"before" middleware should be able to access req', async () => {
    const req = {};

    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const getFunctionContext = (request) => {
        expect(request.req).toBe(req);
    };

    handler.before(getFunctionContext);

    await handler(req, {});
});

test("If there is an error in the before middlewares the error middlewares are invoked", async () => {
    const error = new Error("Some error 227");
    const baseHandler = () => {};
    const failingMiddleware = () => {
        throw error;
    };

    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const baseHandlerSpy = sinon.spy(baseHandler);
    const failingMiddlewareSpy = sinon.spy(failingMiddleware);
    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    const handler = middy(baseHandlerSpy);

    handler.before(failingMiddlewareSpy).onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(baseHandlerSpy.calledOnce).toBe(false);
        expect(failingMiddlewareSpy.threw()).toBe(true);
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If there is an error in the original handler the error middlewares are invoked", async () => {
    const error = new Error("Some error 255");
    const handler = middy((req, context) => {
        throw error;
    });

    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    handler.onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If there is an error in the after middlewares the error middlewares are invoked", async () => {
    const error = new Error("Some error 275");
    const baseHandler = () => {
        return { foo: "bar" };
    };
    const failingMiddleware = () => {
        throw error;
    };
    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const baseHandlerSpy = sinon.spy(baseHandler);
    const failingMiddlewareSpy = sinon.spy(failingMiddleware);
    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    const handler = middy(baseHandler);

    handler.after(failingMiddlewareSpy).onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(baseHandlerSpy.calledOnce).toBe(false);
        expect(failingMiddlewareSpy.threw()).toBe(true);
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If theres an error and one error middleware handles the error, the next error middlewares is not executed", async () => {
    const expectedResponse = { message: "error handled" };

    const handler = middy(() => {
        throw new Error("Some error 304");
    });
    const onErrorMiddleware1 = () => {
        return expectedResponse;
    };
    const onErrorMiddleware2 = () => {};

    const onErrorMiddleware1Spy = sinon.spy(onErrorMiddleware1);
    const onErrorMiddleware2Spy = sinon.spy(onErrorMiddleware2);

    handler.onError(onErrorMiddleware1Spy).onError(onErrorMiddleware2Spy);

    const response = await handler();
    expect(onErrorMiddleware1Spy.calledOnce).toBe(true);
    expect(onErrorMiddleware2Spy.calledOnce).toBe(false);
    expect(response).toEqual(expectedResponse);
});

test("If theres an error and the first error middleware doesn't handle the error, the next error middlewares is executed", async () => {
    const expectedResponse = { message: "error handled" };

    const handler = middy(() => {
        throw new Error("Some error 331");
    });
    const onErrorMiddleware1 = () => {};
    const onErrorMiddleware2 = () => {
        return expectedResponse;
    };

    const onErrorMiddleware1Spy = sinon.spy(onErrorMiddleware1);
    const onErrorMiddleware2Spy = sinon.spy(onErrorMiddleware2);

    handler.onError(onErrorMiddleware1Spy).onError(onErrorMiddleware2Spy);

    const response = await handler();
    expect(onErrorMiddleware1Spy.calledOnce).toBe(true);
    expect(onErrorMiddleware2Spy.calledOnce).toBe(true);
    expect(response).toEqual(expectedResponse);
});

test("It handles synchronous errors generated by throw statements in the before middleware", async () => {
    const expectedError = new Error("Some error 357");

    const beforeMiddleware = () => {
        throw expectedError;
    };

    const handler = middy(() => {});

    handler.before(beforeMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the original handler", async () => {
    const expectedError = new Error("Some error 374");

    const handler = middy((req, context) => {
        throw expectedError;
    });

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the after middleware", async () => {
    const expectedError = new Error("Some error 386");

    const handler = middy(() => {
        return { foo: "bar" };
    });
    const afterMiddleware = () => {
        throw expectedError;
    };

    handler.after(afterMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the error middleware", async () => {
    const expectedError = new Error("successive error in error handler");

    const handler = middy(() => {
        throw new Error("original error");
    });
    const onErrorMiddleware = () => {
        throw expectedError;
    };

    handler.onError(onErrorMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It should support handlers that return promises instead of using the callback", async () => {
    const handler = middy((req, context) => {
        return Promise.resolve({ some: "response" });
    });

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should support async handlers", async () => {
    const handler = middy(() => {
        return { some: "response" };
    });

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should be possible to await a middyfied handler", async () => {
    const baseHandler = async (req, context) =>
        Promise.resolve({ some: "response" });
    const handler = middy(baseHandler);

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should be possible to catch a middyfied handler rejection", async () => {
    const baseHandler = async (req, context) =>
        Promise.reject(new Error("Some error 452"));
    const handler = middy(baseHandler);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("Some error 452");
    }
});

test("Error from async handler with no callback is thrown up", async () => {
    const baseHandler = async (req, context) => {
        throw new Error("some error");
    };
    const handler = middy(baseHandler);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("some error");
    }
});

test("Error from async handler is consumed by onError middleware", async () => {
    const handler = middy(async (req, context) => {
        throw new Error("some error");
    });
    let onErrorWasCalled = false;

    handler.use({
        onError: (request) => {
            onErrorWasCalled = true;
            request.response = {};
        },
    });

    await handler();
    expect(onErrorWasCalled).toBe(true);
});

test("A handler that returns a rejected promise will behave as an errored execution", async () => {
    const handler = middy((req, context) => {
        return Promise.reject(new Error("bad stuff happened"));
    });

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("bad stuff happened");
    }
});

test("An async handler that throws an error is threated as a failed execution", async () => {
    const handler = middy(() => {
        throw new Error("bad stuff happened");
    });

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("bad stuff happened");
    }
});

test("It should handle async middlewares", async () => {
    const asyncBefore = async () => {};
    const asyncAfter = async () => {};

    const handler = middy((req, context) => {
        return { some: "response" };
    });

    const asyncBeforeSpy = sinon.spy(asyncBefore);
    const asyncAfterSpy = sinon.spy(asyncAfter);

    handler.before(asyncBeforeSpy).after(asyncAfterSpy);

    await handler();

    expect(asyncBeforeSpy.callCount).toBe(1);
    expect(asyncAfterSpy.callCount).toBe(1);
});

test("It should handle async error middlewares", async () => {
    const expectedError = new Error("Error in handler");

    const asyncOnError = async (request) => {
        request.error = null;
        request.response = { result: "The error is handled" };
    };

    const handler = middy((req, context) => {
        throw expectedError;
    });

    handler.onError(asyncOnError);

    const response = await handler();

    expect(response).toEqual({ result: "The error is handled" });
});

test("It should be able to short circuit a before middleware", async () => {
    const before1 = sinon.spy(() => {
        return { body: "short" };
    });
    const before2 = sinon.spy(() => {});
    const handler = middy().before(before1).before(before2);

    const response = await handler();
    expect(response.body).toBe("short");
    expect(before1.callCount).toBe(1);
    expect(before2.callCount).toBe(0);
});

test("It should run mutiple times", async () => {
    const before = sinon.spy(() => {});
    const handler = middy().before(before);
    await handler();
    await handler();
    expect(before.callCount).toBe(2);
});

// see issue #49 (https://github.com/middyjs/middy/issues/49)
test("Handles error thrown in async functions", async () => {
    const beforeMiddleware = async () => {
        throw new Error("I am throwing in an async func");
    };

    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    handler.before(beforeMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("I am throwing in an async func");
    }
});

test("It will stop invoking all the onError handlers if one of them returns a promise that rejects", async () => {
    const handler = middy((req, context) => {
        throw new Error("something bad happened");
    });

    const middleware1 = {
        onError: (request) => {
            request.response = { error: request.error };
            return Promise.reject(request.error);
        },
    };
    const middleware2 = {
        onError: (request) => {
            request.middleware2_called = true;
            return Promise.resolve(request.error);
        },
    };

    handler.use(middleware1).use(middleware2);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("something bad happened");
        expect(handler.middleware2_called).toBe(undefined);
    }
});

// Plugin
test("Should trigger all plugin hooks", async () => {
    const plugin = {
        beforePrefetch: sinon.spy(),
        requestStart: sinon.spy(),
        beforeMiddleware: sinon.spy(),
        afterMiddleware: sinon.spy(),
        beforeHandler: sinon.spy(),
        afterHandler: sinon.spy(),
        requestEnd: sinon.spy(),
    };
    const beforeMiddleware = sinon.spy();
    const baseHandler = sinon.spy();
    const afterMiddleware = sinon.spy();

    const handler = middy(baseHandler, plugin)
        .before(beforeMiddleware)
        .after(afterMiddleware);

    await handler();

    expect(plugin.beforePrefetch.callCount).toBe(1);
    expect(plugin.requestStart.callCount).toBe(1);
    expect(plugin.beforeMiddleware.callCount).toBe(2);
    expect(plugin.afterMiddleware.callCount).toBe(2);
    expect(plugin.beforeHandler.callCount).toBe(1);
    expect(plugin.afterHandler.callCount).toBe(1);
    expect(plugin.requestEnd.callCount).toBe(1);
});

test('"use" can add onError middleware', async () => {
    const handler = middy();
    const onError = () => {};
    const middleware = () => ({ onError });
    handler.use(middleware());
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test('"use" can add single object with all types of middlewares', async () => {
    const handler = middy();
    const before = () => {};
    const after = () => {};
    const onError = () => {};
    const middleware = () => ({ before, after, onError });
    handler.use(middleware());
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test('"use" can add multiple before middleware', async () => {
    const handler = middy();
    const before = () => {};
    const middleware = () => ({ before });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.before[1]).toBe(before);
});

test('"use" can add multiple after middleware', async () => {
    const handler = middy();
    const after = () => {};
    const middleware = () => ({ after });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.after[1]).toBe(after);
});

test('"use" can add multiple onError middleware', async () => {
    const handler = middy();
    const onError = () => {};
    const middleware = () => ({ onError });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.onError[0]).toBe(onError);
    expect(handler.__middlewares.onError[1]).toBe(onError);
});

test('"use" can add multiple object with all types of middlewares', async () => {
    const handler = middy();
    const before = () => {};
    const after = () => {};
    const onError = () => {};
    const middleware = () => ({ before, after, onError });
    handler.use([middleware(), middleware()]);
    expect(handler.__middlewares.before[0]).toBe(before);
    expect(handler.__middlewares.after[0]).toBe(after);
    expect(handler.__middlewares.onError[0]).toBe(onError);
    expect(handler.__middlewares.before[1]).toBe(before);
    expect(handler.__middlewares.after[1]).toBe(after);
    expect(handler.__middlewares.onError[1]).toBe(onError);
});

test('"before" should add a before middleware', async () => {
    const handler = middy();
    const before = () => {};

    handler.before(before);
    expect(handler.__middlewares.before[0]).toBe(before);
});

test('"after" should add a before middleware', async () => {
    const handler = middy();
    const after = () => {};

    handler.after(after);
    expect(handler.__middlewares.after[0]).toBe(after);
});

test('"onError" should add a before middleware', async () => {
    const handler = middy();
    const onError = () => {};

    handler.onError(onError);
    expect(handler.__middlewares.onError[0]).toBe(onError);
});

test("It should execute before and after middlewares in the right order", async () => {
    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const executedBefore = [];
    const executedAfter = [];
    const m1 = () => ({
        before: () => {
            executedBefore.push("m1");
        },
        after: () => {
            executedAfter.push("m1");
        },
    });

    const m2 = () => ({
        before: () => {
            executedBefore.push("m2");
        },
        after: () => {
            executedAfter.push("m2");
        },
    });

    handler.use(m1()).use(m2());

    // executes the handler
    const response = await handler();
    expect(executedBefore).toEqual(["m1", "m2"]);
    expect(executedAfter).toEqual(["m2", "m1"]);
    expect(response).toEqual({ foo: "bar" });
});

test('"before" middlewares should be able to change context', async () => {
    let handlerContext;
    const handler = middy((req, context) => {
        handlerContext = context;
        return { foo: "bar" };
    });

    const changeContextMiddleware = (request) => {
        request.context.modified = true;
    };

    handler.before(changeContextMiddleware);

    await handler();
    expect(handlerContext.modified).toBe(true);
});

test('"before" middleware should be able to modify context', async () => {
    const handler = middy((req, context) => {
        expect(req.modifiedSpread).toBe(true);
        expect(req.modifiedAssign).toBe(true);
        return { foo: "bar" };
    });

    const getFunctionContext = (request) => {
        request.req = {
            ...request.req,
            modifiedSpread: true,
        };
        Object.assign(request.req, { modifiedAssign: true });
    };

    handler.before(getFunctionContext);

    await handler();
});

test('"after" middlewares should be able to change response', async () => {
    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const changeResponseMiddleware = (request) => {
        request.response.modified = true;
    };

    handler.after(changeResponseMiddleware);

    const response = await handler();
    expect(response.modified).toBe(true);
});

test('"before" middleware should be able to access req', async () => {
    const req = {};

    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    const getFunctionContext = (request) => {
        expect(request.req).toBe(req);
    };

    handler.before(getFunctionContext);

    await handler(req, {});
});

test("If there is an error in the before middlewares the error middlewares are invoked", async () => {
    const error = new Error("Some error 227");
    const baseHandler = () => {};
    const failingMiddleware = () => {
        throw error;
    };

    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const baseHandlerSpy = sinon.spy(baseHandler);
    const failingMiddlewareSpy = sinon.spy(failingMiddleware);
    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    const handler = middy(baseHandlerSpy);

    handler.before(failingMiddlewareSpy).onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(baseHandlerSpy.calledOnce).toBe(false);
        expect(failingMiddlewareSpy.threw()).toBe(true);
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If there is an error in the original handler the error middlewares are invoked", async () => {
    const error = new Error("Some error 255");
    const handler = middy((req, context) => {
        throw error;
    });

    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    handler.onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If there is an error in the after middlewares the error middlewares are invoked", async () => {
    const error = new Error("Some error 275");
    const baseHandler = () => {
        return { foo: "bar" };
    };
    const failingMiddleware = () => {
        throw error;
    };
    const onErrorMiddleware = (request) => {
        expect(request.error).toEqual(error);
    };

    const baseHandlerSpy = sinon.spy(baseHandler);
    const failingMiddlewareSpy = sinon.spy(failingMiddleware);
    const onErrorMiddlewareSpy = sinon.spy(onErrorMiddleware);

    const handler = middy(baseHandler);

    handler.after(failingMiddlewareSpy).onError(onErrorMiddlewareSpy);

    try {
        await handler();
    } catch (e) {
        expect(baseHandlerSpy.calledOnce).toBe(false);
        expect(failingMiddlewareSpy.threw()).toBe(true);
        expect(onErrorMiddlewareSpy.calledOnce).toBe(true);
    }
});

test("If theres an error and one error middleware handles the error, the next error middlewares is not executed", async () => {
    const expectedResponse = { message: "error handled" };

    const handler = middy(() => {
        throw new Error("Some error 304");
    });
    const onErrorMiddleware1 = () => {
        return expectedResponse;
    };
    const onErrorMiddleware2 = () => {};

    const onErrorMiddleware1Spy = sinon.spy(onErrorMiddleware1);
    const onErrorMiddleware2Spy = sinon.spy(onErrorMiddleware2);

    handler.onError(onErrorMiddleware1Spy).onError(onErrorMiddleware2Spy);

    const response = await handler();
    expect(onErrorMiddleware1Spy.calledOnce).toBe(true);
    expect(onErrorMiddleware2Spy.calledOnce).toBe(false);
    expect(response).toEqual(expectedResponse);
});

test("If theres an error and the first error middleware doesn't handle the error, the next error middlewares is executed", async () => {
    const expectedResponse = { message: "error handled" };

    const handler = middy(() => {
        throw new Error("Some error 331");
    });
    const onErrorMiddleware1 = () => {};
    const onErrorMiddleware2 = () => {
        return expectedResponse;
    };

    const onErrorMiddleware1Spy = sinon.spy(onErrorMiddleware1);
    const onErrorMiddleware2Spy = sinon.spy(onErrorMiddleware2);

    handler.onError(onErrorMiddleware1Spy).onError(onErrorMiddleware2Spy);

    const response = await handler();
    expect(onErrorMiddleware1Spy.calledOnce).toBe(true);
    expect(onErrorMiddleware2Spy.calledOnce).toBe(true);
    expect(response).toEqual(expectedResponse);
});

test("It handles synchronous errors generated by throw statements in the before middleware", async () => {
    const expectedError = new Error("Some error 357");

    const beforeMiddleware = () => {
        throw expectedError;
    };

    const handler = middy(() => {});

    handler.before(beforeMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the original handler", async () => {
    const expectedError = new Error("Some error 374");

    const handler = middy((req, context) => {
        throw expectedError;
    });

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the after middleware", async () => {
    const expectedError = new Error("Some error 386");

    const handler = middy(() => {
        return { foo: "bar" };
    });
    const afterMiddleware = () => {
        throw expectedError;
    };

    handler.after(afterMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It handles synchronous errors generated by throw statements in the error middleware", async () => {
    const expectedError = new Error("successive error in error handler");

    const handler = middy(() => {
        throw new Error("original error");
    });
    const onErrorMiddleware = () => {
        throw expectedError;
    };

    handler.onError(onErrorMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e).toEqual(expectedError);
    }
});

test("It should support handlers that return promises instead of using the callback", async () => {
    const handler = middy((req, context) => {
        return Promise.resolve({ some: "response" });
    });

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should support async handlers", async () => {
    const handler = middy(() => {
        return { some: "response" };
    });

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should be possible to await a middyfied handler", async () => {
    const baseHandler = async (req, context) =>
        Promise.resolve({ some: "response" });
    const handler = middy(baseHandler);

    const response = await handler();
    expect(response).toEqual({ some: "response" });
});

test("It should be possible to catch a middyfied handler rejection", async () => {
    const baseHandler = async (req, context) =>
        Promise.reject(new Error("Some error 452"));
    const handler = middy(baseHandler);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("Some error 452");
    }
});

test("Error from async handler with no callback is thrown up", async () => {
    const baseHandler = async (req, context) => {
        throw new Error("some error");
    };
    const handler = middy(baseHandler);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toEqual("some error");
    }
});

test("Error from async handler is consumed by onError middleware", async () => {
    const handler = middy(async (req, context) => {
        throw new Error("some error");
    });
    let onErrorWasCalled = false;

    handler.use({
        onError: (request) => {
            onErrorWasCalled = true;
            request.response = {};
        },
    });

    await handler();
    expect(onErrorWasCalled).toBe(true);
});

test("A handler that returns a rejected promise will behave as an errored execution", async () => {
    const handler = middy((req, context) => {
        return Promise.reject(new Error("bad stuff happened"));
    });

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("bad stuff happened");
    }
});

test("An async handler that throws an error is threated as a failed execution", async () => {
    const handler = middy(() => {
        throw new Error("bad stuff happened");
    });

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("bad stuff happened");
    }
});

test("It should handle async middlewares", async () => {
    const asyncBefore = async () => {};
    const asyncAfter = async () => {};

    const handler = middy((req, context) => {
        return { some: "response" };
    });

    const asyncBeforeSpy = sinon.spy(asyncBefore);
    const asyncAfterSpy = sinon.spy(asyncAfter);

    handler.before(asyncBeforeSpy).after(asyncAfterSpy);

    await handler();

    expect(asyncBeforeSpy.callCount).toBe(1);
    expect(asyncAfterSpy.callCount).toBe(1);
});

test("It should handle async error middlewares", async () => {
    const expectedError = new Error("Error in handler");

    const asyncOnError = async (request) => {
        request.error = null;
        request.response = { result: "The error is handled" };
    };

    const handler = middy((req, context) => {
        throw expectedError;
    });

    handler.onError(asyncOnError);

    const response = await handler();

    expect(response).toEqual({ result: "The error is handled" });
});

test("It should be able to short circuit a before middleware", async () => {
    const before1 = sinon.spy(() => {
        return { body: "short" };
    });
    const before2 = sinon.spy(() => {});
    const handler = middy().before(before1).before(before2);

    const response = await handler();
    expect(response.body).toBe("short");
    expect(before1.callCount).toBe(1);
    expect(before2.callCount).toBe(0);
});

test("It should run mutiple times", async () => {
    const before = sinon.spy(() => {});
    const handler = middy().before(before);
    await handler();
    await handler();
    expect(before.callCount).toBe(2);
});

// see issue #49 (https://github.com/middyjs/middy/issues/49)
test("Handles error thrown in async functions", async () => {
    const beforeMiddleware = async () => {
        throw new Error("I am throwing in an async func");
    };

    const handler = middy((req, context) => {
        return { foo: "bar" };
    });

    handler.before(beforeMiddleware);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("I am throwing in an async func");
    }
});

test("It will stop invoking all the onError handlers if one of them returns a promise that rejects", async () => {
    const handler = middy((req, context) => {
        throw new Error("something bad happened");
    });

    const middleware1 = {
        onError: (request) => {
            request.response = { error: request.error };
            return Promise.reject(request.error);
        },
    };
    const middleware2 = {
        onError: (request) => {
            request.middleware2_called = true;
            return Promise.resolve(request.error);
        },
    };

    handler.use(middleware1).use(middleware2);

    try {
        await handler();
    } catch (e) {
        expect(e.message).toBe("something bad happened");
        expect(handler.middleware2_called).toBe(undefined);
    }
});

// Plugin
test("Should trigger all plugin hooks", async () => {
    const plugin = {
        beforePrefetch: sinon.spy(),
        requestStart: sinon.spy(),
        beforeMiddleware: sinon.spy(),
        afterMiddleware: sinon.spy(),
        beforeHandler: sinon.spy(),
        afterHandler: sinon.spy(),
        requestEnd: sinon.spy(),
    };
    const beforeMiddleware = sinon.spy();
    const baseHandler = sinon.spy();
    const afterMiddleware = sinon.spy();

    const handler = middy(baseHandler, plugin)
        .before(beforeMiddleware)
        .after(afterMiddleware);

    await handler();

    expect(plugin.beforePrefetch.callCount).toBe(1);
    expect(plugin.requestStart.callCount).toBe(1);
    expect(plugin.beforeMiddleware.callCount).toBe(2);
    expect(plugin.afterMiddleware.callCount).toBe(2);
    expect(plugin.beforeHandler.callCount).toBe(1);
    expect(plugin.afterHandler.callCount).toBe(1);
    expect(plugin.requestEnd.callCount).toBe(1);
});
