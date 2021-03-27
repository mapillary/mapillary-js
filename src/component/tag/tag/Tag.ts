import {
    share,
    map,
} from "rxjs/operators";
import {
    Observable,
    Subject,
} from "rxjs";

import { EventEmitter } from "../../../util/EventEmitter";
import { Geometry } from "../geometry/Geometry";
import {
    TagEvent,
    TagStateEvent,
} from "./TagEvent";

/**
 * @class Tag
 * @abstract
 * @classdesc Abstract class representing the basic functionality of for a tag.
 */
export abstract class Tag extends EventEmitter {
    protected _id: string;
    protected _geometry: Geometry;

    protected _notifyChanged$: Subject<Tag>;

    /**
     * Create a tag.
     *
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     */
    constructor(id: string, geometry: Geometry) {
        super();

        this._id = id;
        this._geometry = geometry;

        this._notifyChanged$ = new Subject<Tag>();

        this._notifyChanged$
            .subscribe(
                (t: Tag): void => {
                    const type: TagEvent = "tag";
                    const event: TagStateEvent = {
                        target: this,
                        type,
                    };
                    this.fire(type, event);
                });

        this._geometry.changed$
            .subscribe(
                (g: Geometry): void => {
                    const type: TagEvent = "geometry";
                    const event: TagStateEvent = {
                        target: this,
                        type,
                    };
                    this.fire(type, event);
                });
    }

    /**
     * Get id property.
     * @returns {string}
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Get geometry property.
     * @returns {Geometry} The geometry of the tag.
     */
    public get geometry(): Geometry {
        return this._geometry;
    }

    /**
     * Get changed observable.
     * @returns {Observable<Tag>}
     * @ignore
     */
    public get changed$(): Observable<Tag> {
        return this._notifyChanged$;
    }

    /**
     * Get geometry changed observable.
     * @returns {Observable<Tag>}
     * @ignore
     */
    public get geometryChanged$(): Observable<Tag> {
        return this._geometry.changed$.pipe(
            map(
                (): Tag => {
                    return this;
                }),
            share());
    }

    /** @inheritdoc */
    public on(
        type: "geometry",
        handler: (event: TagStateEvent) => void)
        : void;
    public on(
        type: "tag",
        handler: (event: TagStateEvent) => void)
        : void;
    public on(
        type: TagEvent,
        handler: (event: TagStateEvent) => void): void;
    public on<T>(
        type: TagEvent,
        handler: (event: T) => void): void {
        super.on(type, handler);
    }
}
