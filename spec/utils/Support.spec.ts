import * as support from "../../src/utils/Support";

describe("isWebGLSupported", () => {
    it("should not be supported when get context returns undefined", () => {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        spyOn(canvas, "getContext").and.returnValue(undefined);
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(false);
    });

    it("should not be supported when it does not support any extensions", () => {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const context: WebGLRenderingContext = <WebGLRenderingContext>{
            getSupportedExtensions: (): string[] => { return []; },
        };
        spyOn(canvas, "getContext").and.returnValue(context);
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(false);
    });

    it("should not be supported when context is returned and it support extensions", () => {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        const context: WebGLRenderingContext = <WebGLRenderingContext>{
            getSupportedExtensions: (): string[] => {
                return ["OES_texture_float", "OES_standard_derivatives"];
            },
        };
        spyOn(canvas, "getContext").and.returnValue(context);
        spyOn(document, "createElement").and.returnValue(canvas);

        expect(support.isWebGLSupported()).toBe(true);
    });
});

describe("isWebGLSupportedCached", () => {
    it("should not call isWebGLSupported only once", () => {
        const canvas: HTMLCanvasElement = document.createElement("canvas");
        spyOn(canvas, "getContext").and.returnValue(undefined);
        const createElementSpy: jasmine.Spy = spyOn(document, "createElement");
        createElementSpy.and.returnValue(canvas);

        const result1: boolean = support.isWebGLSupportedCached();
        expect(result1).toBe(false);
        expect(createElementSpy.calls.count()).toBe(1);

        const result2: boolean = support.isWebGLSupportedCached();
        expect(result2).toBe(false);
        expect(createElementSpy.calls.count()).toBe(1);
    });
});
