import {Container, Navigator} from "../Viewer";
import {ParameterMapillaryError} from "../Error";
import {IUIConfiguration, UI, UIService} from "../UI";

import * as _ from "underscore";

export interface IUIStateOperation extends Function {
    (uiState: UIState): UIState;
}

export interface IUIActivateCommand {
    name: string;
    activate: boolean;
}

export interface IUIConfigureCommand {
    name: string;
    conf: IUIConfiguration;
}

export class UIState {
    private _uis: {[key: string]: UI} = {};
    private _coverActivated: boolean;

    constructor (container: Container, navigator: Navigator) {
        for (let ui of _.values(UIService.registeredUIs)) {
            this._uis[ui.uiName] = new ui(ui.uiName, container, navigator);
        }
        this._coverActivated = false;
    }

    public activate(name: string): void {
        this.checkName(name);
        this.get(name).activate();
    }

    public configure(name: string, configuration: IUIConfiguration): void {
        this.checkName(name);
        this.get(name).configure(configuration);
    }

    public deactivate(name: string): void {
        this.checkName(name);
        this.get(name).deactivate();
    }

    public activateCover(): void {
        this._coverActivated = true;
    }

    public deactivateCover(): void {
        this._coverActivated = false;
    }

    public get(name: string): UI {
        this.checkName(name);
        return this._uis[name];
    }

    private checkName(name: string): void {
        if (!(name in this._uis)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
    }
}

export default UIState;
