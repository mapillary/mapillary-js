import { fromEvent as observableFromEvent, Observable } from "rxjs";

export class KeyboardService {
    private _keyDown$: Observable<KeyboardEvent>;
    private _keyUp$: Observable<KeyboardEvent>;

    constructor(canvasContainer: HTMLElement) {
        this._keyDown$ = observableFromEvent<KeyboardEvent>(canvasContainer, "keydown");
        this._keyUp$ = observableFromEvent<KeyboardEvent>(canvasContainer, "keyup");
    }

    public get keyDown$(): Observable<KeyboardEvent> {
        return this._keyDown$;
    }

    public get keyUp$(): Observable<KeyboardEvent> {
        return this._keyUp$;
    }
}

export default KeyboardService;
