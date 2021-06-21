/**
 * Interface describing event emitter members.
 */
export interface IEventEmitter {
    /**
     * @ignore
     */
    fire<T>(
        type: string,
        event: T): void;

    /**
     * Unsubscribe from an event by its name.
     * @param {string} type - The name of the event
     * to unsubscribe from.
     * @param {(event: T) => void} handler - The
     * handler to remove.
     */
    off<T>(
        type: string,
        handler: (event: T) => void): void;

    /**
     * Subscribe to an event by its name.
     * @param {string} type - The name of the event
     * to subscribe to.
     * @param {(event: T) => void} handler - The
     * handler called when the event occurs.
     */
    on<T>(
        type: string,
        handler: (event: T) => void): void;
}
