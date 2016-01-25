import {Container, Navigator} from "../Viewer";

export abstract class UI {
    public static uiName: string = "not_worthy";

    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    constructor (name: string, container: Container, navigator: Navigator) {
        this._navigator = navigator;
        this._container = container;
        this._name = name;
    }

    public activate(): void {
        this._activate();
    };

    protected abstract _activate(): void;

    public deactivate(): void {
        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._deactivate();
    };

    protected abstract _deactivate(): void;

    public configure(options: any): void {
        return;
    }
}

export default UI;
