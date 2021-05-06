import { Tag } from "../Tag";
import { TagEventType } from "./TagEventType";

/**
 * @event
 *
 * `TagStateEvent` is the event type for tag
 * state changes.
 *
 * @example
 * ```js
 * var tag = new OutlineTag({ // tag options });
 * // Set an event listener
 * tag.on('tag', function() {
 *   console.log("A tag event has occurred.");
 * });
 * ```
 */
export interface TagStateEvent {
    /**
     * The component object that fired the event.
     */
    target: Tag;

    /**
     * The event type.
     */
    type: TagEventType;
}
