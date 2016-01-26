import {EventEmitter} from "../Utils";
import {Container, Navigator} from "../Viewer";

export abstract class UI extends EventEmitter {
    public static uiName: string = "not_worthy";

    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    private _activated: boolean;

    constructor (name: string, container: Container, navigator: Navigator) {
        this._navigator = navigator;
        this._container = container;
        this._activated = false;
        this._name = name;
        super();
    }

    public activate(): void {
        if (this._activated) {
            return;
        }

        this._activate();
        this._activated = true;
    };

    protected abstract _activate(): void;

    public deactivate(): void {
        if (!this._activated) {
            return;
        }

        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._deactivate();
        this._activated = false;
    };

    protected abstract _deactivate(): void;

    public get activated(): boolean {
        return this._activated;
    }

    public configure(options: any): void {
        return;
    }
}

export default UI;
