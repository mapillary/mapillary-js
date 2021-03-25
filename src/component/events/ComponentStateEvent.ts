import { IComponent } from "../interfaces/IComponent";
import { Marker } from "../marker/marker/Marker";
import { Geometry } from "../tag/geometry/Geometry";
import { TagMode } from "../tag/TagMode";
import { ComponentEvent } from "./ComponentEvent";

/**
 * @interface ComponentStateEvent
 *
 * `ComponentStateEvent` is the event type for component
 * state changes.
 *
 * @example
 * // The `hover` event is an example of a `ComponentStateEvent`.
 * // Set up an event listener on the direction component.
 * var directionComponent = viewer.getComponent('direction');
 * directionComponent.on('hover', function(e) {
 *   console.log('A hover event has occured');
 * });
 */
export interface ComponentStateEvent {
    /**
     * The component object that fired the event.
     */
    target: IComponent;

    /**
     * The event type.
     */
    type: ComponentEvent;
}

export interface ComponentGeometryEvent extends ComponentStateEvent {
    /**
     * Geometry related to the event.
     */
    geometry: Geometry;
}

export interface ComponentHoverEvent extends ComponentStateEvent {
    /**
     * The image id corresponding to the element or object that
     * is being hovered. When the mouse leaves the element or
     * object the id will be null.
     */
    id: string;
}

export interface ComponentMarkerEvent extends ComponentStateEvent {
    /**
     * The marker that was affected by the event.
     */
    marker: Marker;
}

export interface ComponentPlayEvent extends ComponentStateEvent {
    /**
     * Value indiciating if the component is playing or not.
     */
    playing: boolean;
}

export interface ComponentTagModeEvent extends ComponentStateEvent {
    /**
     * Value indicating the current tag mode of the component.
     */
    mode: TagMode;
}
