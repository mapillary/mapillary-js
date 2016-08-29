import {Subscription} from "rxjs/Subscription";

import {Node} from "../Graph";
import {EventEmitter} from "../Utils";
import {Navigator} from "../Viewer";

export class EventLauncher {
    private _stateSubscription: Subscription;
    private _loadingSubscription: Subscription;

    private _eventEmitter: EventEmitter;
    private _navigator: Navigator;

    constructor(eventEmitter: EventEmitter, navigator: Navigator) {
        this._eventEmitter = eventEmitter;
        this._navigator = navigator;

        this._loadingSubscription = this._navigator.loadingService.loading$
            .subscribe((loading: boolean): void => {
                this._eventEmitter.fire("loadingchanged", loading);
            });

        this._stateSubscription = this._navigator.stateService.currentNodeExternal$
            .subscribe((node: Node): void => {
                this._eventEmitter.fire("nodechanged", node);
            });

        this._navigator.stateService.moving$
            .subscribe(
                (moving: boolean) => {
                    if (moving) {
                        this._eventEmitter.fire("movestart", null);
                    } else {
                        this._eventEmitter.fire("moveend", null);
                    }
                });
    }

    public dispose(): void {
        this._loadingSubscription.unsubscribe();
        this._stateSubscription.unsubscribe();
    }
}

export default EventLauncher;
