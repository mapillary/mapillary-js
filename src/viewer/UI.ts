import {IUI, NoneUI, CoverUI, KeyboardUI, SimpleNavUI, SimpleUI, GlUI} from "../UI";
import {Navigator} from "../Viewer";
import {InitializationMapillaryError} from "../Error";

export class UI {

    public static uis: {[key: string]: new (c: HTMLElement, n: Navigator) => IUI } = {};

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
            throw new InitializationMapillaryError();
        }

        UI.uis[name] = ui;
    }
}

export namespace UI {
    "use strict";

    UI.initialize();
}
