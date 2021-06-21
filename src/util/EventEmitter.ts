import { IEventEmitter } from "./interfaces/IEventEmitter";

export class EventEmitter implements IEventEmitter {
    private _events: { [type: string]: ((event: any) => void)[]; };

    constructor() { this._events = {}; }

    /**
     * @ignore
     */
    public fire<T>(
        type: string,
        event: T): void {
        if (!this._listens(type)) { return; }
        for (const handler of this._events[type]) {
            handler(event);
        }
    }

    /**
     * Unsubscribe from an event by its name.
     * @param {string} type - The name of the event
     * to unsubscribe from.
     * @param {(event: T) => void} handler - The
     * handler to remove.
     */
    public off<T>(
        type: string,
        handler: (event: T) => void): void {
        if (!type) { this._events = {}; return; }

        if (this._listens(type)) {
            const index = this._events[type].indexOf(handler);
            if (index >= 0) {
                this._events[type].splice(index, 1);
            }
            if (!this._events[type].length) {
                delete this._events[type];
            }
        }
    }

    /**
     * Subscribe to an event by its name.
     * @param {string} type - The name of the event
     * to subscribe to.
     * @param {(event: T) => void} handler - The
     * handler called when the event occurs.
     */
    public on<T>(
        type: string,
        handler: (event: T) => void): void {
        this._events[type] = this._events[type] || [];
        this._events[type].push(handler);
    }

    private _listens(eventType: string): boolean {
        return eventType in this._events;
    }
}
