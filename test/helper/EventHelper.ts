export class EventHelper {
    public static createKeyboardEvent(typeArg: string, eventInitDict?: KeyboardEventInit): KeyboardEvent {
        return new KeyboardEvent(typeArg, eventInitDict);
    }

    public static createMouseEvent(
        eventType: string,
        params: PointerEventInit,
        target?: EventTarget): MouseEvent {
        const event = new MouseEvent(
            eventType,
            {
                bubbles: params.bubbles !== undefined ?
                    params.bubbles : true,
                cancelable: params.cancelable !== undefined ?
                    params.cancelable : true,
                detail: params.detail !== undefined ? params.detail : 0,
                screenX: params.screenX !== undefined ? params.screenX : 0,
                screenY: params.screenY !== undefined ? params.screenY : 0,
                clientX: params.clientX !== undefined ? params.clientX : 0,
                clientY: params.clientY !== undefined ? params.clientY : 0,
                ctrlKey: !!params.ctrlKey,
                altKey: !!params.altKey,
                shiftKey: !!params.shiftKey,
                metaKey: !!params.metaKey,
                button: params.button !== undefined ? params.button : 0,
                buttons: params.buttons !== undefined ? params.button : 1,
                relatedTarget: !!target ?
                    target : document.createElement("div"),
            });

        // Workaround for pointer event not existing in JSDom
        (<any>event).pointerType = params.pointerType ?? "mouse";
        return event;
    }

    public static createTouchEvent(eventType: string, shiftKey?: boolean): TouchEvent {
        const event: UIEvent = document.createEvent("UIEvent");

        event.initEvent(eventType, true, true);

        Object.defineProperty(
            event,
            "touches",
            {
                get: (): Touch[] => { return [<Touch>{ clientX: 0, clientY: 0 }]; },
            });

        Object.defineProperty(
            event,
            "targetTouches",
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
        return new UIEvent(
            eventType,
            {
                bubbles: canBubbleArg,
                cancelable: cancelableArg,
                detail: detailArg,
                view: window,
            });
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
