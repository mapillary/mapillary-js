import {
    IUI,
    CoverUI,
    GlUI,
    KeyboardUI,
    NoneUI,
    SimpleUI,
    SimpleCacheUI,
    SimpleNavUI,
    SimplePlayUI,
    DetectionsUI,
    SphereUI,
} from "../UI";
import {Container, Navigator} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

/**
 * Static class for registered UIs.
 * @class
 * @static
 */
export class UI {

    private static uis: {[key: string]: new (c: Container, n: Navigator) => IUI } = {};

    /**
     * Initializes the static UI class.
     * @static
     */
    public static initialize(): void {
        UI.add("cover", CoverUI);
        UI.add("gl", GlUI);
        UI.add("keyboard", KeyboardUI);
        UI.add("none", NoneUI);
        UI.add("simple", SimpleUI);
        UI.add("simplecache", SimpleCacheUI);
        UI.add("simplenav", SimpleNavUI);
        UI.add("simpleplay", SimplePlayUI);
        UI.add("detections", DetectionsUI);
        UI.add("sphere", SphereUI);
    }

    /**
     * Registers a UI type to the UI list.
     *
     * @param {string} name Name of the UI.
     * @param {IUI} ui Type implementing IUI with a constructor taking a
     *                 Container and a Navigator.
     * @static
     */
    public static add(name: string, ui: new (container: Container, navigator: Navigator) => IUI): void {
        if (name in UI.uis) {
            throw new ParameterMapillaryError("Name already exist in UI dictionary");
        }

        UI.uis[name] = ui;
    }

    /**
     * Retrieves an instance of a UI type.
     *
     * @param {string} name Name of the registered UI.
     * @param {Container} container Container element.
     * @param {Navigator} navigator Navigator for graph and state interaction.
     * @returns {IUI} An instance of a class implementing the IUI interface.
     * @static
     */
    public static get(name: string, container: Container, navigator: Navigator): IUI {
        if (!(name in UI.uis)) {
            throw new ParameterMapillaryError("Name does not exist in UI dictionary");
        }

        return new UI.uis[name](container, navigator);
    }
}

export namespace UI {
    "use strict";

    UI.initialize();
}
