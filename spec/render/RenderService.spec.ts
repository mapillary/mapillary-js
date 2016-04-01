/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {ISize, RenderMode, RenderService} from "../../src/Render";
import {IFrame} from "../../src/State";

describe("RenderService.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        expect(renderService).toBeDefined();
    });
});

describe("RenderService.renderMode", () => {
    it("should default to letterboxing", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.renderMode$
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Letterbox);

                    done();
                });
    });

    it("should return latest render mode on subscripion", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.renderMode$.onNext(RenderMode.Fill);

        renderService.renderMode$
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });
});

describe("RenderService.size", () => {
    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .subscribe(
                (size: ISize): void => {
                    expect(size).toBeDefined();

                    done();
                });
    });

    it("should have an initial value", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

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
        let renderService: RenderService = new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .take(2)
            .subscribe(
                (size: ISize): void => { return; },
                (e: Error): void => { return; },
                (): void => { done(); });

        renderService.resize$.onNext(null);
    });
});

