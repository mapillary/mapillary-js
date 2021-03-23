export type ComponentEvent =
    /**
     * Event fired when a geometry has been created.
     *
     * @event geometrycreated
     * @memberof TagComponent
     * @instance
     * @type {ComponentGeometryEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('geometrycreated', function() {
     *   console.log("A geometrycreated event has occurred.");
     * });
     */
    | "geometrycreated"

    /**
     * Fired when the hovered element of a component changes.
     *
     * @event hover
     * @memberof DirectionComponent
     * @memberof SequenceComponent
     * @instance
     * @type {ComponentHoverEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('hover', function() {
     *   console.log("A hover event has occurred.");
     * });
     */
    | "hover"

    /**
     * Fired when a marker drag interaction ends.
     *
     * @event markerdragend
     * @memberof MarkerComponent
     * @instance
     * @type {ComponentMarkerEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('markerdragend', function() {
     *   console.log("A markerdragend event has occurred.");
     * });
     */
    | "markerdragend"

    /**
     * Fired when a marker drag interaction starts.
     *
     * @event markerdragstart
     * @memberof MarkerComponent
     * @instance
     * @type {ComponentMarkerEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('markerdragstart', function() {
     *   console.log("A markerdragstart event has occurred.");
     * });
     */
    | "markerdragstart"

    /**
     * Fired when the position of a marker is changed.
     *
     * @event markerposition
     * @memberof MarkerComponent
     * @instance
     * @type {ComponentMarkerEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('markerposition', function() {
     *   console.log("A markerposition event has occurred.");
     * });
     */
    | "markerposition"


    /**
     * Event fired when playing starts or stops.
     *
     * @event playing
     * @memberof SequenceComponent
     * @instance
     * @type {ComponentPlayEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('playing', function() {
     *   console.log("A playing event has occurred.");
     * });
     */
    | "playing"

    /**
     * Event fired when an interaction to create a geometry ends.
     *
     * @description A create interaction can by a geometry being created
     * or by the creation being aborted.
     *
     * @event tagcreateend
     * @memberof TagComponent
     * @instance
     * @type {ComponentStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('tagcreateend', function() {
     *   console.log("A tagcreateend event has occurred.");
     * });
     */
    | "tagcreateend"

    /**
     * Event fired when an interaction to create a geometry starts.
     *
     * @description A create interaction starts when the first vertex
     * is created in the geometry.
     *
     * @event tagcreatestart
     * @memberof TagComponent
     * @instance
     * @type {ComponentStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('tagcreatestart', function() {
     *   console.log("A tagcreatestart event has occurred.");
     * });
     */
    | "tagcreatestart"

    /**
     * Event fired when the create mode is changed.
     *
     * @event tagmode
     * @memberof TagComponent
     * @instance
     * @type {ComponentTagModeEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('tagmode', function() {
     *   console.log("A tagmode event has occurred.");
     * });
     */
    | "tagmode"

    /**
     * Event fired when the tags collection has changed.
     *
     * @event tags
     * @memberof TagComponent
     * @instance
     * @type {ComponentStateEvent}
     * @example
     * // Initialize the viewer
     * var viewer = new Mapillary.Viewer({ // viewer options });
     * var component = viewer.getComponet('<component-name>');
     * // Set an event listener
     * component.on('tags', function() {
     *   console.log("A tags event has occurred.");
     * });
     */
    | "tags";
