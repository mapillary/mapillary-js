import {IUI, NoneUI, CoverUI, KeyboardUI, SimpleNavUI, SimpleUI, GlUI} from "../UI";
import {Navigator} from "../Viewer";
import {ParameterMapillaryError} from "../Error";


/**
 * Static class for registered UIs.
 * @class
 * @static
 */
export class UI {

    private static uis: {[key: string]: new (c: HTMLElement, n: Navigator) => IUI } = {};

    /**
     * Initializes the static UI class.
     * @static
     */
    public static initialize(): void {
        UI.add("none", NoneUI);
        UI.add("cover", CoverUI);
        UI.add("keyboard", KeyboardUI);
        UI.add("simplenav", SimpleNavUI);
        UI.add("simple", SimpleUI);
        UI.add("gl", GlUI);
    }

    /**
     * Registers a UI type to the UI list.
     *
     * @param {string} name Name of the UI.
     * @param {IUI} ui Type implementing IUI with a constructor taking an
     *                 HTMLElement and a Navigator.
     * @static
     */
    public static add(name: string, ui: new (c: HTMLElement, n: Navigator) => IUI): void {
        if (name in UI.uis) {
            throw new ParameterMapillaryError("Name already exist in UI dictionary");
        }

        UI.uis[name] = ui;
    }

    /**
     * Retrieves an instance of a UI type.
     *
     * @param {string} name Name of the registered UI.
     * @param {HTMLElement} c Container element.
     * @param {Navigator} n Navigator for graph and state interaction.
     * @returns {IUI} An instance of a class implementing the IUI interface.
     * @static
     */
    public static get(name: string, c: HTMLElement, n: Navigator): IUI {
        if (!(name in UI.uis)) {
            throw new ParameterMapillaryError("Name does not exist in UI dictionary");
        }

        return new UI.uis[name](c, n);
    }
}

export namespace UI {
    "use strict";

    UI.initialize();
}
