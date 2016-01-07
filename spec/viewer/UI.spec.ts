/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {UI, Navigator} from "../../src/Viewer";
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
    var element: HTMLElement;
    var navigator: Navigator;

    beforeEach(() => {
        element = document.createElement("div");
        navigator = new Navigator("clientId");
    });

    it("should retreive a NoneUI", () => {
        let ui = UI.get("none", element, navigator);

        expect(ui instanceof NoneUI).toBeTruthy();
    });

    it("should throw if UI name does not exist", () => {
        expect(() => {
            UI.get("nonexisting", element, navigator);
        }).toThrowError("Name does not exist in UI dictionary");
    });

    it("should throw if UI name already in exist", () => {
        expect(() => {
            UI.add("none", NoneUI);
        }).toThrowError("Name already exist in UI dictionary");
    });

    it("should add and retreive a TestUI", () => {
        UI.add("test", TestUI)

        let ui = UI.get("test", element, navigator);

        expect(ui instanceof TestUI).toBeTruthy();
    });
});
