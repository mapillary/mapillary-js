import {IUI, NoneUI, CoverUI, KeyboardUI, SimpleNavUI, SimpleUI, GlUI} from "../UI";
import {Navigator} from "../Viewer";
import {InitializationMapillaryError} from "../Error";

export class UI {

    public static uis: {[key: string]: (container: HTMLElement, navigator: Navigator) => IUI } = {};

    public static initialize(): void {
        UI.add("cover", (c: HTMLElement, n: Navigator): IUI => { return new CoverUI(c); });
        UI.add("simple", (c: HTMLElement, n: Navigator): IUI => { return new SimpleUI(c, n); });
        UI.add("gl", (c: HTMLElement, n: Navigator): IUI => { return new GlUI(c, n.state); });
        UI.add("keyboard", (c: HTMLElement, n: Navigator): IUI => { return new KeyboardUI(c, n); });
        UI.add("simplenav", (c: HTMLElement, n: Navigator): IUI => { return new SimpleNavUI(c, n); });
        UI.add("none", (c: HTMLElement, n: Navigator): IUI => { return new NoneUI(); });
    }

    public static add(name: string, ctorFunc: (container: HTMLElement, navigator: Navigator) => IUI): void {
        if (name in UI.uis) {
            throw new InitializationMapillaryError();
        }

        UI.uis[name] = ctorFunc;
    }
}

export namespace UI {
    "use strict";

    UI.initialize();
}
