/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as THREE from "three";
import * as rx from "rx";

import {Container, Navigator, UI} from "../../src/Viewer";
import {IUI, NoneUI} from "../../src/UI";

class TestUI implements IUI {
    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }
}

describe("UI", () => {
    var container: Container;
    var navigator: Navigator;

    beforeEach(() => {
        spyOn(document, 'getElementById').and.callFake(() => { return document.createElement('div'); });
        spyOn(window, 'requestAnimationFrame').and.callFake(() => { return () => {}; })
        spyOn(THREE, 'WebGLRenderer').and.callFake(() => {
            return {
                 setSize: () => { },
                 setClearColor: () => { },
                 domElement: document.createElement('div'),
            };
        });

        let observable: rx.Observable<any> = new rx.Subject<any>();

        container = new Container("fake", "initialPhotoId", observable);
        navigator = new Navigator("clientId");
    });

    it("should retreive a NoneUI", () => {
        let ui = UI.get("none", container, navigator);

        expect(ui instanceof NoneUI).toBeTruthy();
    });

    it("should throw if UI name does not exist", () => {
        expect(() => {
            UI.get("nonexisting",  container, navigator);
        }).toThrowError("Name does not exist in UI dictionary");
    });

    it("should throw if UI name already in exist", () => {
        expect(() => {
            UI.add("none", NoneUI);
        }).toThrowError("Name already exist in UI dictionary");
    });

    it("should add and retreive a TestUI", () => {
        UI.add("test", TestUI)

        let ui = UI.get("test", container, navigator);

        expect(ui instanceof TestUI).toBeTruthy();
    });
});
