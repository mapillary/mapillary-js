export class EventHelper {
    public static createKeyboardEvent(typeArg: string, eventInitDict?: KeyboardEventInit): KeyboardEvent {
        return new KeyboardEvent(typeArg, eventInitDict);
    }

    public static createMouseEvent(eventType: string, params: MouseEventInit, target?: EventTarget): MouseEvent {
        const mouseEvent: MouseEvent = document.createEvent("MouseEvent");

        mouseEvent.initMouseEvent(
            eventType,
            params.bubbles !== undefined ? params.bubbles : true,
            params.cancelable !== undefined ? params.cancelable : true,
            window,
            params.detail !== undefined ? params.detail : 0,
            params.screenX !== undefined ? params.screenX : 0,
            params.screenY !== undefined ? params.screenY : 0,
            params.clientX !== undefined ? params.clientX : 0,
            params.clientY !== undefined ? params.clientY : 0,
            !!params.ctrlKey,
            !!params.altKey,
            !!params.shiftKey,
            !!params.metaKey,
            params.button !== undefined ? params.button : 0,
            !!target ? target : document.createElement("div"));

        return mouseEvent;
    }

    public static createTouchEvent(eventType: string, shiftKey: boolean): TouchEvent {
        const event: UIEvent = document.createEvent("UIEvent");

        Object.defineProperty(
            event,
            "touches",
            {
                get: (): Touch[] => { return [<Touch>{ clientX: 0, clientY: 0 }]; },
            });

        Object.defineProperty(
            event,
            "shiftKey",
            {
                get: (): boolean => { return shiftKey; },
            });

        return <TouchEvent>event;
    }

    public static createUIEvent(eventType: string, canBubbleArg?: boolean, cancelableArg?: boolean, detailArg?: number): UIEvent {
        const uiEvent: UIEvent = document.createEvent("UIEvent");

        uiEvent.initUIEvent(
            eventType,
            canBubbleArg,
            cancelableArg,
            window,
            detailArg);

        return uiEvent;
    }

    public static createWheelEvent(eventType: string, params: WheelEventInit, target?: EventTarget): WheelEvent {
        const wheelEvent: MouseEvent = document.createEvent("MouseEvent");

        wheelEvent.initMouseEvent(
            eventType,
            params.bubbles !== undefined ? params.bubbles : true,
            params.cancelable !== undefined ? params.cancelable : true,
            window,
            params.detail !== undefined ? params.detail : 0,
            params.screenX !== undefined ? params.screenX : 0,
            params.screenY !== undefined ? params.screenY : 0,
            params.clientX !== undefined ? params.clientX : 0,
            params.clientY !== undefined ? params.clientY : 0,
            !!params.ctrlKey,
            !!params.altKey,
            !!params.shiftKey,
            !!params.metaKey,
            params.button !== undefined ? params.button : 0,
            !!target ? target : document.createElement("div"));

        return <WheelEvent>wheelEvent;
    }
}

export default EventHelper;
