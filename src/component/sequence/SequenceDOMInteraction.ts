import {Subject} from "rxjs/Subject";

import {EdgeDirection} from "../../Edge";

export class SequenceDOMInteraction {
    private _mouseEnterDirection$: Subject<EdgeDirection>;
    private _mouseLeaveDirection$: Subject<EdgeDirection>;

    constructor() {
        this._mouseEnterDirection$ = new Subject<EdgeDirection>();
        this._mouseLeaveDirection$ = new Subject<EdgeDirection>();
    }

    public get mouseEnterDirection$(): Subject<EdgeDirection> {
        return this._mouseEnterDirection$;
    }

    public get mouseLeaveDirection$(): Subject<EdgeDirection> {
        return this._mouseLeaveDirection$;
    }
}

export default SequenceDOMInteraction;
