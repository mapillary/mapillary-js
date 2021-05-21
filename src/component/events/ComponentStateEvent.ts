import { IComponent } from "../interfaces/IComponent";
import { Marker } from "../marker/marker/Marker";
import { Geometry } from "../tag/geometry/Geometry";
import { TagMode } from "../tag/TagMode";
import { ComponentEvent } from "./ComponentEvent";
import { ComponentEventType } from "./ComponentEventType";

/**
 * Interface for component state events.
 *
 * @example
 * ```js
 * // The `hover` event is an example of a `ComponentStateEvent`.
 * // Set up an event listener on the direction component.
 * var directionComponent = viewer.getComponent('direction');
 * directionComponent.on('hover', function(e) {
 *   console.log('A hover event has occured');
 * });
 * ```
 */
export interface ComponentStateEvent extends ComponentEvent {
    type:
    | "tagcreateend"
    | "tagcreatestart"
    | "tags";
}
