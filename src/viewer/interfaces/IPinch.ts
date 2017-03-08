export interface IPinch {
    /**
     * X client coordinate for center of pinch.
     */
    clientX: number;

    /**
     * Y client coordinate for center of pinch.
     */
    clientY: number;

    /**
     * X page coordinate for center of pinch.
     */
    pageX: number;

    /**
     * Y page coordinate for center of pinch.
     */
    pageY: number;

    /**
     * X screen coordinate for center of pinch.
     */
    screenX: number;

    /**
     * Y screen coordinate for center of pinch.
     */
    screenY: number;

    /**
     * Distance change in X direction between touches
     * compared to previous event.
     */
    changeX: number;

    /**
     * Distance change in Y direction between touches
     * compared to previous event.
     */
    changeY: number;

    /**
     * Pixel distance between touches.
     */
    distance: number;

    /**
     * Change in pixel distance between touches compared
     * to previous event.
     */
    distanceChange: number;

    /**
     * Distance in X direction between touches.
     */
    distanceX: number;

    /**
     * Distance in Y direction between touches.
     */
    distanceY: number;

    /**
     * Original touch event.
     */
    originalEvent: TouchEvent;

    /**
     * First touch.
     */
    touch1: Touch;

    /**
     * Second touch.
     */
    touch2: Touch;
}

export default IPinch;
