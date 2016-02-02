import {ParameterMapillaryError} from "../Error";
import {Node} from "../Graph";
import {Container, IViewerOptions, Navigator} from "../Viewer";
import {UI} from "../UI";

import * as _ from "underscore";
import * as rx from "rx";

interface IUIStateOperation extends Function {
    (uiState: UIState): UIState;
}

interface IUICommand {
    name: string;
    activate: boolean;
}

class UIState {
    private _allUIs: {[key: string]: UI} = {};
    private _coverActivated: boolean;

    constructor (container: Container, navigator: Navigator) {
        for (let ui of _.values(UIService.registeredUIs)) {
            this._allUIs[ui.uiName] = new ui(ui.uiName, container, navigator);
        }
        this._coverActivated = false;
    }

    public activate(name: string): void {
        if (!(name in this._allUIs)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        this.get(name).activate();
    }

    public deactivate(name: string): void {
        if (!(name in this._allUIs)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        this.get(name).deactivate();
    }

    public activateCover(): void {
        this._coverActivated = true;
    }

    public deactivateCover(): void {
        this._coverActivated = false;
    }

    public get(name: string): UI {
        if (!(name in this._allUIs)) {
            throw new ParameterMapillaryError(`UI does not exist: ${name}`);
        }
        return this._allUIs[name];
    }
}

export class UIService {
    public static registeredUIs: {[key: string]: typeof UI} = {};

    private _container: Container;
    private _navigator: Navigator;

    private _activate$: rx.Subject<IUICommand> =  new rx.Subject<IUICommand>();
    private _activateCover$: rx.Subject<boolean> = new rx.Subject<boolean>();
    private _updates$: rx.Subject<IUIStateOperation> = new rx.Subject<IUIStateOperation>();
    private _uiState$: rx.ConnectableObservable<UIState>;

    public static initialize(): void {
        return;
    }

    constructor (container: Container, navigator: Navigator, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;

        let uiS: UIState = new UIState(container, navigator);

        let coverUI: UI = uiS.get("cover");
        coverUI.configure({key: key});
        coverUI.on("coverButtonPressed", (e: Event) => {
            this._navigator.moveToKey(key).subscribe((node: Node) => {
                this.deactivateCover();
            });
        });

        this._uiState$ = this._updates$
            .scan<UIState>(
            (uiState: UIState, operation: IUIStateOperation): UIState => {
                return operation(uiState);
            },
            uiS)
            .shareReplay(1)
            .publish();

        this._uiState$.connect();

        this._activate$.map((uiCommand: IUICommand): IUIStateOperation => {
            console.log(uiCommand);
            return (uiState: UIState): UIState => {
                if (uiCommand.activate) {
                    uiState.activate(uiCommand.name);
                } else {
                    uiState.deactivate(uiCommand.name);
                }
                return uiState;
            };
        }).subscribe(this._updates$);

        this._activateCover$.map((activate: boolean): IUIStateOperation => {
            return (uiState: UIState): UIState => {
                if (activate) {
                    uiState.activateCover();
                } else {
                    uiState.deactivateCover();
                }
                return uiState;
            };
        }).subscribe(this._updates$);

        // this.uFalse(options.player, "player");
        // this.uTrue(options.gl, "gl");

        this._navigator.moveToKey(key).subscribe((node: Node) => {
            this.deactivateCover();
            this.uTrue(options.attribution, "attribution");
            this.uTrue(options.cache, "cache");
            this.uFalse(options.debug, "debug");
            this.uTrue(options.directions, "directions");
            this.uTrue(options.keyboard, "keyboard");
            this.uTrue(options.loading, "loading");
            this.uTrue(options.mouse, "mouse");
            this.uTrue(options.mouse, "gl");
        });

        // if (options.cover === undefined || options.cover === true) {
        //     this.activateCover();
        // } else {
        // }
    }

    public static register(ui: typeof UI): void {
        UIService.registeredUIs[ui.uiName] = ui;
    }

    public activate(name: string): void {
        this._activate$.onNext({activate: true, name: name});
    }

    public deactivate(name: string): void {
        this._activate$.onNext({activate: false, name: name});
    }

    public activateCover(): void {
        this._activateCover$.onNext(true);
    }

    public deactivateCover(): void {
        this._activateCover$.onNext(false);
    }

    private uFalse(option: boolean, name: string): void {
        if (option === undefined || option === false) {
            this._activate$.onNext({activate: false, name: name});
        }
        this._activate$.onNext({activate: true, name: name});
    }

    private uTrue(option: boolean, name: string): void {
        if (option === undefined || option === true) {
            this._activate$.onNext({activate: true, name: name});
            return;
        }
        this._activate$.onNext({activate: false, name: name});
    }

}

console.log("HEJ HEJ");

export namespace UIService {
    "use strict";
    UIService.initialize();
}

export default UIService;
