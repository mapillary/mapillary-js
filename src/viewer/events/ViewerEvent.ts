export type ViewerEvent =
    /**
     * Fired when the viewing direction of the camera changes.
     *
     * @event bearing
     * @memberof Viewer
     * @instance
     * @type {ViewerBearingStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("bearing", function() {
     *   console.log("A bearing event has occurred.");
     * });
     */
    | "bearing"

    /**
     * Fired when a pointing device (usually a mouse) is
     * pressed and released at the same point in the viewer.
     *
     * @event click
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("click", function() {
     *   console.log("A click event has occurred.");
     * });
     */
    | "click"

    /**
     * Fired when the right button of the mouse is clicked
     * within the viewer.
     *
     * @event contextmenu
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("contextmenu", function() {
     *   console.log("A contextmenu event has occurred.");
     * });
     */
    | "contextmenu"

    /**
     * Fired when a pointing device (usually a mouse) is clicked twice at
     * the same point in the viewer.
     *
     * @event dblclick
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("dblclick", function() {
     *   console.log("A dblclick event has occurred.");
     * });
     */
    | "dblclick"

    /**
     * Fired when the viewer's vertical field of view changes.
     *
     * @event fov
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("fov", function() {
     *   console.log("A fov event has occurred.");
     * });
     */
    | "fov"

    /**
     * Fired when the viewer is loading data.
     *
     * @event loading
     * @memberof Viewer
     * @instance
     * @type {ViewerLoadingEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("loading", function() {
     *   console.log("A loading event has occurred.");
     * });
     */
    | "loading"

    /**
     * Fired when a pointing device (usually a mouse) is pressed
     * within the viewer.
     *
     * @event mousedown
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousedown", function() {
     *   console.log("A mousedown event has occurred.");
     * });
     */
    | "mousedown"

    /**
     * Fired when a pointing device (usually a mouse)
     * is moved within the viewer.
     *
     * @event mousemove
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mousemove", function() {
     *   console.log("A mousemove event has occurred.");
     * });
     */
    | "mousemove"

    /**
     * Fired when a pointing device (usually a mouse)
     * leaves the viewer's canvas.
     *
     * @event mouseout
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseout", function() {
     *   console.log("A mouseout event has occurred.");
     * });
     */
    | "mouseout"

    /**
     * Fired when a pointing device (usually a mouse)
     * is moved onto the viewer's canvas.
     *
     * @event mouseover
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseover", function() {
     *   console.log("A mouseover event has occurred.");
     * });
     */
    | "mouseover"

    /**
     * Fired when a pointing device (usually a mouse)
     * is released within the viewer.
     *
     * @event mouseup
     * @memberof Viewer
     * @instance
     * @type {ViewerMouseEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("mouseup", function() {
     *   console.log("A mouseup event has occurred.");
     * });
     */
    | "mouseup"


    /**
     * Fired when the viewer motion stops and it is in a fixed
     * position with a fixed point of view.
     *
     * @event moveend
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("moveend", function() {
     *   console.log("A moveend event has occurred.");
     * });
     */
    | "moveend"

    /**
     * Fired when the motion from one view to another start,
     * either by changing the position (e.g. when changing node)
     * or when changing point of view
     * (e.g. by interaction such as pan and zoom).
     *
     * @event movestart
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("movestart", function() {
     *   console.log("A movestart event has occurred.");
     * });
     */
    | "movestart"

    /**
     * Fired when the navigable state of the viewer changes.
     *
     * @event navigable
     * @memberof Viewer
     * @instance
     * @type {ViewerNavigableEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("navigable", function() {
     *   console.log("A navigable event has occurred.");
     * });
     */
    | "navigable"

    /**
     * Fired every time the viewer navigates to a new node.
     *
     * @event node
     * @memberof Viewer
     * @instance
     * @type {ViewerNodeEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("node", function() {
     *   console.log("A node event has occurred.");
     * });
     */
    | "node"

    /**
     * Fired when the viewer's position changes.
     *
     * @description The viewer's position changes when transitioning
     * between nodes.
     *
     * @event position
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("position", function() {
     *   console.log("A position event has occurred.");
     * });
     */
    | "position"

    /**
     * Fired when the viewer's point of view changes. The
     * point of view changes when the bearing, or tilt changes.
     *
     * @event pov
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("pov", function() {
     *   console.log("A pov event has occurred.");
     * });
     */
    | "pov"

    /**
     * Fired when the viewer is removed. After this event is emitted
     * you must not call any methods on the viewer.
     *
     * @event remove
     * @memberof Viewer
     * @instance
     * @type {ViewerStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("remove", function() {
     *   console.log("A remove event has occurred.");
     * });
     */
    | "remove"

    /**
     * Fired every time the sequence edges of the current node changes.
     *
     * @event sequenceedges
     * @memberof Viewer
     * @instance
     * @type {ViewerNavigationEdgeStatusEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("sequenceedges", function() {
     *   console.log("A sequenceedges event has occurred.");
     * });
     */
    | "sequenceedges"

    /**
     * Fired every time the spatial edges of the current node changes.
     *
     * @event spatialedges
     * @memberof Viewer
     * @instance
     * @type {ViewerNavigationEdgeStatusEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new mapillary.Viewer({ // viewer options });
     * // Set an event listener
     * viewer.on("spatialedges", function() {
     *   console.log("A spatialedges event has occurred.");
     * });
     */
    | "spatialedges"
