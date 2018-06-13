import {fromEvent as observableFromEvent, Observable} from "rxjs";

export class KeyboardService {
    private _keyDown$: Observable<KeyboardEvent>;

    constructor(canvasContainer: HTMLElement) {
        this._keyDown$ = observableFromEvent<KeyboardEvent>(canvasContainer, "keydown");
    }

    public get keyDown$(): Observable<KeyboardEvent> {
        return this._keyDown$;
    }
}

export default KeyboardService;
