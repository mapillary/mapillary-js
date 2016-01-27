import {ParameterMapillaryError} from "../Error";
import {Node} from "../Graph";
import {
    AttributionUI,
    CoverUI,
    DebugUI,
    DetectionsUI,
    DirectionsUI,
    EventUI,
    GLUI,
    KeyboardUI,
    LoadingUI,
    MouseUI,
    NoneUI,
    SimpleCacheUI,
    SimpleNavUI,
    SimpleUI,
    SphereUI,
    UI,
} from "../UI";
import {Container, IViewerOptions, Navigator} from "../Viewer";


import * as _ from "underscore";

export class UIService {
    private static registeredUIs: {[key: string]: typeof UI} = {};

    private uis: {[key: string]: UI} = {};
    private _activeUIs: string[];

    private _container: Container;
    private _navigator: Navigator;

    private _key: string;
    private _coverUI: string;

    public static initialize(): void {
        UIService.register(AttributionUI);
        UIService.register(CoverUI);
        UIService.register(DebugUI);
        UIService.register(DetectionsUI);
        UIService.register(DirectionsUI);
        UIService.register(EventUI);
        UIService.register(GLUI);
        UIService.register(KeyboardUI);
        UIService.register(LoadingUI);
        UIService.register(MouseUI);
        UIService.register(NoneUI);
        UIService.register(SimpleCacheUI);
        UIService.register(SimpleNavUI);
        UIService.register(SimpleUI);
        UIService.register(SphereUI);
    }

    constructor (container: Container, navigator: Navigator, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;

        for (let ui of _.values(UIService.registeredUIs)) {
            this.uis[ui.uiName] = new ui(ui.uiName, container, navigator);
        }

        this._activeUIs = ["gl", "loading", "attribution", "simplecache", "directions", "mouse"];
        this._key = key;

        if (options.cover) {
            this._coverUI = "cover";
        }

        if (options.debug) {
            this._activeUIs.push("debug");
        }

        if (this._coverUI != null) {
            let cUI: UI = this.get(this._coverUI);
            cUI.configure({key: key});

            cUI.on("coverButtonPressed", (e: Event) => {
                this.get("loading").activate();
                this._navigator.moveToKey(this._key).first().subscribe((node: Node) => {
                    this.deactivateCover();
                });
            });

            this.activateCover();
        } else {
            this.get("loading").activate();
            this._navigator.moveToKey(this._key).first().subscribe((node: Node) => {
                this.deactivateCover();
            });
        }
    }

    public static register(ui: typeof UI): void {
        UIService.registeredUIs[ui.uiName] = ui;
    }

    public activate(name: string): void {
        if (!(name in this.uis)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        this.uis[name].activate();
    }

    public deactivate(name: string): void {
        if (!(name in this.uis)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        this.uis[name].deactivate();
    }

    public activateCover(): void {
        if (this._coverUI != null) {
            this.get(this._coverUI).activate();
        }
        for (let name of this._activeUIs) {
            this.deactivate(name);
        }
    }

    public deactivateCover(): void {
        if (this._coverUI != null) {
            this.get(this._coverUI).deactivate();
        }
        for (let name of this._activeUIs) {
            this.activate(name);
        }
    }

    public get(name: string): UI {
        if (!(name in this.uis)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        return this.uis[name];
    }

}

export namespace UIService {
    "use strict";
    UIService.initialize();
}
