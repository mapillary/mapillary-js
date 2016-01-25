import {
    AttributionUI,
    CoverUI,
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
import {Container, Navigator, Viewer} from "../Viewer";
import {ParameterMapillaryError} from "../Error";

import * as _ from "underscore";

export class UIService {
    private static registeredUIs: {[key: string]: typeof UI} = {};
    private uis: {[key: string]: UI} = {};

    private _container: Container;
    private _navigator: Navigator;
    private _viewer: Viewer;

    public static initialize(): void {
        UIService.register(AttributionUI);
        UIService.register(CoverUI);
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

    constructor (viewer: Viewer, container: Container, navigator: Navigator) {
        this._viewer = viewer;
        this._container = container;
        this._navigator = navigator;

        for (let ui of _.values(UIService.registeredUIs)) {
            this.uis[ui.uiName] = new ui(ui.uiName, container, navigator);
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
