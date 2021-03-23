import * as support from "../../src/utils/Support";

describe("isWebGLSupported", () => {
    it("should not be supported when get context returns undefined", () => {
        const canvas = document.createElement("canvas");
        spyOn(canvas, "getContext").and.returnValue(undefined);
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(false);
    });

    it("should not be supported when it does not support any extensions", () => {
        const canvas = document.createElement("canvas");
        const context = <WebGLRenderingContext>{
            getSupportedExtensions: (): string[] => { return []; },
        };
        spyOn(canvas, "getContext")
            .and.callFake(
                (contextId: string): RenderingContext => {
                    if (contextId === "webgl") { return context; }
                    return undefined;
                });
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(false);
    });

    it("should be supported when WebGL2 context is returned", () => {
        const canvas = document.createElement("canvas");
        const context2 = <WebGL2RenderingContext>{};
        spyOn(canvas, "getContext")
            .and.callFake(
                (contextId: string): RenderingContext => {
                    if (contextId === "webgl2") { return context2; }
                    return undefined;
                });
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(true);
    });

    it("should be supported when context is returned and it support extensions", () => {
        const canvas = document.createElement("canvas");
        const context = <WebGLRenderingContext>{
            getSupportedExtensions: (): string[] => {
                return ["OES_standard_derivatives"];
            },
        };
        spyOn(canvas, "getContext")
            .and.callFake(
                (contextId: string): RenderingContext => {
                    if (contextId === "webgl") { return context; }
                    return undefined;
                });
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(true);
    });
});

describe("isWebGLSupportedCached", () => {
    it("should call isWebGLSupported only once", () => {
        const canvas = document.createElement("canvas");
        spyOn(canvas, "getContext").and.returnValue(undefined);
        const createElementSpy = spyOn(document, "createElement");
        createElementSpy.and.returnValue(canvas);

        const result1 = support.isWebGLSupportedCached();
        expect(result1).toBe(false);
        expect(createElementSpy.calls.count()).toBe(1);

        const result2 = support.isWebGLSupportedCached();
        expect(result2).toBe(false);
        expect(createElementSpy.calls.count()).toBe(1);
    });
});
