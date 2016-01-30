import {Container, Navigator} from "../Viewer";
import {IUIConfiguration, UI, UIState, IUIStateOperation, IUIActivateCommand, IUIConfigureCommand} from "../UI";

import * as rx from "rx";

export class UIService {
    public static registeredUIs: {[key: string]: typeof UI} = {};

    private _container: Container;
    private _navigator: Navigator;

    private _activate$: rx.Subject<IUIActivateCommand> =  new rx.Subject<IUIActivateCommand>();
    private _activateCover$: rx.Subject<boolean> = new rx.Subject<boolean>();
    private _configure$: rx.Subject<IUIConfigureCommand> = new rx.Subject<IUIConfigureCommand>();
    private _uiState$: rx.ConnectableObservable<UIState>;
    private _updates$: rx.Subject<IUIStateOperation> = new rx.Subject<IUIStateOperation>();

    constructor (container: Container, navigator: Navigator) {
        this._container = container;
        this._navigator = navigator;

        this._uiState$ = this._updates$
            .scan<UIState>(
            (uiState: UIState, operation: IUIStateOperation): UIState => {
                return operation(uiState);
            },
            new UIState(container, navigator))
            .shareReplay(1)
            .publish();

        this._activate$.map((uiCommand: IUIActivateCommand): IUIStateOperation => {
            return (uiState: UIState): UIState => {
                if (uiCommand.activate) {
                    uiState.activate(uiCommand.name);
                } else {
                    uiState.deactivate(uiCommand.name);
                }
                return uiState;
            };
        }).subscribe(this._updates$);

        this._configure$.map((confCommand: IUIConfigureCommand): IUIStateOperation => {
            return (uiState: UIState): UIState => {
                uiState.configure(confCommand.name, confCommand.conf);
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

        this._uiState$.connect();
    }

    public static register(ui: typeof UI): void {
        if (UIService.registeredUIs[ui.uiName] === undefined) {
            UIService.registeredUIs[ui.uiName] = ui;
        }
    }

    public activate(name: string): void {
        this._activate$.onNext({activate: true, name: name});
    }

    public deactivate(name: string): void {
        this._activate$.onNext({activate: false, name: name});
    }

    public configure(name: string, conf: IUIConfiguration): void {
        this._configure$.onNext({conf: conf, name: name});
    }

    public activateCover(): void {
        this._activateCover$.onNext(true);
    }

    public deactivateCover(): void {
        this._activateCover$.onNext(false);
    }

    public get uiState$(): rx.Observable<UIState> {
        return this._uiState$;
    }
}

export default UIService;
