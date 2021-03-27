import { Tag } from "./Tag";

export type TagEvent =
    /**
     * Event fired when the icon of the outline tag is clicked.
     *
     * @event click
     * @memberof OutlineTag
     * @instance
     * @type {TagMouseEvent}
     * @example
     * var tag = new mapillary.TagComponent.OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('click', function() {
     *   console.log("A click event has occurred.");
     * });
     */
    | "click"

    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event geometry
     * @memberof Tag
     * @instance
     * @type {TagStateEvent}
     * @example
     * var tag = new mapillary.TagComponent.OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('geometry', function() {
     *   console.log("A geometry event has occurred.");
     * });
     */
    | "geometry"

    /**
     * Event fired when a tag has been updated.
     *
     * @event tag
     * @memberof Tag
     * @instance
     * @type {TagStateEvent}
     * @example
     * var tag = new mapillary.TagComponent.OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('tag', function() {
     *   console.log("A tag event has occurred.");
     * });
     */
    | "tag";


/**
 * @interface TagStateEvent
 *
 * `TagStateEvent` is the event type for tag
 * state changes.
 *
 * @example
 * var tag = new mapillary.TagComponent.OutlineTag({ // tag options });
 * // Set an event listener
 * tag.on('tag', function() {
 *   console.log("A tag event has occurred.");
 * });
 */
export interface TagStateEvent {
    /**
     * The component object that fired the event.
     */
    target: Tag;

    /**
     * The event type.
     */
    type: TagEvent;
}
