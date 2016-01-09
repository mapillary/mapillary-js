export class EventEmitter {
    private events: {[eventType: string]: any[]};

    constructor () {
        this.events = {};
    }

    public on(eventType: string, fn: any): void {
        this.events[eventType] = this.events[eventType] || [];
        this.events[eventType].push(fn);
        return;
    }

    public off(eventType: string, fn: any): void {
        if (!eventType) {
            this.events = {};
            return;
        }

        if (!this.listens(eventType)) {
            let idx: number = this.events[eventType].indexOf(fn);
            if (idx >= 0) {
                this.events[eventType].splice(idx, 1);
            }
            if (this.events[eventType].length) {
                delete this.events[eventType];
            }
        } else {
            delete this.events[eventType];
        }

        return;
    }

    public fire(eventType: string, data: any): void {
        if (!this.listens(eventType)) {
            return;
        }

        for (let fn of this.events[eventType]) {
            fn.call(this, data);
        }
        return;
    }

    private listens(eventType: string): boolean {
        return !!(this.events && this.events[eventType]);
    }
}

export default EventEmitter;
