export class EventEmitter {
    private _events: {[eventType: string]: any[]};

    constructor () {
        this._events = {};
    }

    /**
     * Subscribe to an event by its name.
     * @param {string }eventType - The name of the event to subscribe to.
     * @param {any} fn - The handler called when the event occurs.
     */
    public on(eventType: string, fn: any): void {
        this._events[eventType] = this._events[eventType] || [];
        this._events[eventType].push(fn);
        return;
    }

    /**
     * Unsubscribe from an event by its name.
     * @param {string} eventType - The name of the event to subscribe to.
     * @param {any} fn - The handler to remove.
     */
    public off(eventType: string, fn: any): void {
        if (!eventType) {
            this._events = {};
            return;
        }

        if (!this._listens(eventType)) {
            let idx: number = this._events[eventType].indexOf(fn);
            if (idx >= 0) {
                this._events[eventType].splice(idx, 1);
            }
            if (this._events[eventType].length) {
                delete this._events[eventType];
            }
        } else {
            delete this._events[eventType];
        }

        return;
    }

    public fire(eventType: string, data: any): void {
        if (!this._listens(eventType)) {
            return;
        }

        for (let fn of this._events[eventType]) {
            fn.call(this, data);
        }
        return;
    }

    private _listens(eventType: string): boolean {
        return !!(this._events && this._events[eventType]);
    }
}

export default EventEmitter;
