import {ParameterMapillaryError} from "../Error";
import {Container, Navigator} from "../Viewer";
import {CoverUI, UI, IUIConfiguration} from "../UI";

import * as _ from "underscore";

interface IActiveUI {
    active: boolean;
    ui: UI;
}

export class UIService {
    public static registeredCoverUI: typeof CoverUI;
    public static registeredUIs: {[key: string]: typeof UI} = {};

    private _container: Container;
    private _coverActivated: boolean;
    private _coverUI: CoverUI;
    private _navigator: Navigator;
    private _uis: {[key: string]: IActiveUI} = {};

    constructor (container: Container, navigator: Navigator) {
        this._container = container;
        this._navigator = navigator;

        for (let ui of _.values(UIService.registeredUIs)) {
            this._uis[ui.uiName] = {active: false, ui: new ui(ui.uiName, container, navigator)};
        }

        this._coverUI = new UIService.registeredCoverUI("cover", container, navigator);
        this._coverUI.activate();
        this._coverActivated = true;
    }

    public static register(ui: typeof UI): void {
        if (UIService.registeredUIs[ui.uiName] === undefined) {
            UIService.registeredUIs[ui.uiName] = ui;
        }
    }

    public static registerCover(coverUI: typeof CoverUI): void {
        UIService.registeredCoverUI = coverUI;
    }

    public activateCover(): void {
        if (this._coverActivated) {
            return;
        }
        this._coverActivated = true;

        for (let activeUI of _.values(this._uis)) {
            if (activeUI.active) {
                activeUI.ui.deactivate();
            }
        }
        return;
    }

    public deactivateCover(): void {
        if (!this._coverActivated) {
            return;
        }
        this._coverActivated = false;

        for (let activeUI of _.values(this._uis)) {
            if (activeUI.active) {
                activeUI.ui.activate();
            }
        }
        return;
    }

    public activate(name: string): void {
        this.checkName(name);
        this._uis[name].active = true;
        if (!this._coverActivated) {
            this.get(name).activate();
        }
    }

    public configure(name: string, conf: IUIConfiguration): void {
        this.checkName(name);
        this.get(name).configure(conf);
    }

    public deactivate(name: string): void {
        this.checkName(name);
        this._uis[name].active = false;
        if (!this._coverActivated) {
            this.get(name).deactivate();
        }
    }

    public get(name: string): UI {
        return this._uis[name].ui;
    }

    public getCover(): CoverUI {
        return this._coverUI;
    }

    private checkName(name: string): void {
        if (!(name in this._uis)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
    }
}

export default UIService;
