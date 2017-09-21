export class EventHelper {
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

    public static createMouseEvent(eventType: string, params: MouseEventInit, target: EventTarget): MouseEvent {
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
            target);

        return mouseEvent;
    }
}

export default EventHelper;
