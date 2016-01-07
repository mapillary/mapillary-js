import {IUI, NoneUI, CoverUI, KeyboardUI, SimpleNavUI, SimpleUI, GlUI} from "../UI";
import {Navigator} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

export class UI {

    private static uis: {[key: string]: new (c: HTMLElement, n: Navigator) => IUI } = {};

    public static initialize(): void {
        UI.add("none", NoneUI);
        UI.add("cover", CoverUI);
        UI.add("keyboard", KeyboardUI);
        UI.add("simplenav", SimpleNavUI);
        UI.add("simple", SimpleUI);
        UI.add("gl", GlUI);
    }

    public static add(name: string, ui: new (c: HTMLElement, n: Navigator) => IUI): void {
        if (name in UI.uis) {
            throw new ParameterMapillaryError("Name already exist in UI dictionary.");
        }

        UI.uis[name] = ui;
    }

    public static get(name: string, c: HTMLElement, n: Navigator): IUI {
        if (!(name in UI.uis)) {
            throw new ParameterMapillaryError("Name does not exist in UI dictionary.");
        }

        return new UI.uis[name](c, n);
    }
}

export namespace UI {
    "use strict";

    UI.initialize();
}
