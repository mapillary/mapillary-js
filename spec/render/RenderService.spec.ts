/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {
    RenderService,
    GLRenderMode,
    ISize,
} from "../../src/Render";

describe("RenderService.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        expect(renderService).not.toBeNull();
    });
});

describe("RenderService.renderMode", () => {
    it("should default to letterboxing", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        renderService.renderMode$
            .subscribe(
                (renderMode: GLRenderMode): void => {
                    expect(renderMode).toBe(GLRenderMode.Letterbox);

                    done();
                });
    });

    it("should return latest render mode on subscripion", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        renderService.renderMode$.onNext(GLRenderMode.Fill);

        renderService.renderMode$
            .subscribe(
                (renderMode: GLRenderMode): void => {
                    expect(renderMode).toBe(GLRenderMode.Fill);

                    done();
                });
    });
});

describe("RenderService.size", () => {
    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        renderService.size$
            .subscribe(
                (size: ISize): void => {
                    expect(size).toBeDefined();

                    done();
                });
    });

    it("should have an initial value", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        renderService.size$
            .subscribe(
                (size: ISize): void => {
                    expect(size.width).toBe(0);
                    expect(size.height).toBe(0);

                    done();
                });
    });

    it("should emit new value on resize", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element);

        renderService.size$
            .take(2)
            .subscribe(
                (size: ISize): void => { return; },
                (e: Error): void => { return; },
                (): void => { done(); });

        renderService.resize$.onNext(null);
    });
});

