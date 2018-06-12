import {Observable} from "rxjs/Observable";

export class KeyboardService {
    private _keyDown$: Observable<KeyboardEvent>;

    constructor(canvasContainer: HTMLElement) {
        this._keyDown$ = Observable.fromEvent<KeyboardEvent>(canvasContainer, "keydown");
    }

    public get keyDown$(): Observable<KeyboardEvent> {
        return this._keyDown$;
    }
}

export default KeyboardService;
