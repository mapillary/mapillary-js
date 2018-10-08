import {empty as observableEmpty} from "rxjs";

import {skip} from "rxjs/operators";
import * as vd from "virtual-dom";

import {
    DOMRenderer,
    RenderMode,
    RenderService,
} from "../../src/Render";

describe("DOMRenderer.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, observableEmpty(), RenderMode.Letterbox);
        let domRenderer: DOMRenderer = new DOMRenderer(element, renderService, observableEmpty());

        expect(domRenderer).toBeDefined();
    });
});

describe("DOMRenderer.render$", () => {
    it("should render one element", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, observableEmpty(), RenderMode.Letterbox);
        let domRenderer: DOMRenderer = new DOMRenderer(element, renderService, observableEmpty());

        domRenderer.element$
            .subscribe(
                (e: Element): void => {
                    let list: HTMLCollectionOf<Element> =
                        <HTMLCollectionOf<Element>>e.getElementsByClassName("testdiv");

                    expect(list.length).toBe(1);

                    let testDiv: HTMLDivElement = <HTMLDivElement>list[0];

                    expect(testDiv).toBeDefined();
                    expect(testDiv instanceof HTMLDivElement).toBeTruthy();

                    done();
                });

        let vNode: vd.VNode = vd.h("div.testdiv", []);

        domRenderer.render$.next({ name: "test", vnode: vNode });
    });

    it("should render multiple elements with different hash names", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, observableEmpty(), RenderMode.Letterbox);
        let domRenderer: DOMRenderer = new DOMRenderer(element, renderService, observableEmpty());

        domRenderer.element$.pipe(
            skip(1))
            .subscribe(
                (e: Element): void => {
                    for (let i of [1, 2]) {
                        let className: string = "testdiv" + i.toString();

                        let list: HTMLCollectionOf<Element> =
                            <HTMLCollectionOf<Element>>e.getElementsByClassName(className);
                        expect(list.length).toBe(1);

                        let testDiv: HTMLDivElement = <HTMLDivElement>list[0];

                        expect(testDiv).toBeDefined();
                        expect(testDiv instanceof HTMLDivElement).toBeTruthy();
                    }

                    done();
                });

        let vNode1: vd.VNode = vd.h("div.testdiv1", []);
        let vNode2: vd.VNode = vd.h("div.testdiv2", []);

        domRenderer.render$.next({ name: "test1", vnode: vNode1 });
        domRenderer.render$.next({ name: "test2", vnode: vNode2 });
    });

    it("should apply patch", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderService(element, observableEmpty(), RenderMode.Letterbox);
        let domRenderer: DOMRenderer = new DOMRenderer(element, renderService, observableEmpty());

        domRenderer.element$.pipe(
            skip(1))
            .subscribe(
                (e: Element): void => {
                    let list1: HTMLCollectionOf<Element> =
                        <HTMLCollectionOf<Element>>e.getElementsByClassName("testdiv1");
                    expect(list1.length).toBe(0);

                    let list2: HTMLCollectionOf<Element> =
                        <HTMLCollectionOf<Element>>e.getElementsByClassName("testdiv2");
                    expect(list2.length).toBe(1);

                    let testDiv: HTMLDivElement = <HTMLDivElement>list2[0];

                    expect(testDiv).toBeDefined();
                    expect(testDiv instanceof HTMLDivElement).toBeTruthy();

                    done();
                });

        let vNode1: vd.VNode = vd.h("div.testdiv1", []);
        let vNode2: vd.VNode = vd.h("div.testdiv2", []);

        domRenderer.render$.next({ name: "test", vnode: vNode1 });
        domRenderer.render$.next({ name: "test", vnode: vNode2 });
    });
});
