import { Tag } from "./Tag";
import { TagEvent } from "./TagEvent";

/**
 * `TagStateEvent` is the event type for tag
 * state changes.
 *
 * @example
 * ```js
 * var tag = new mapillary.TagComponent.OutlineTag({ // tag options });
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
    type: TagEvent;
}
