import {share, map} from "rxjs/operators";
import {Observable, Subject} from "rxjs";

import {Geometry} from "../../../Component";
import {EventEmitter} from "../../../Utils";

/**
 * @class Tag
 * @abstract
 * @classdesc Abstract class representing the basic functionality of for a tag.
 */
export abstract class Tag extends EventEmitter {
    /**
     * Event fired when a property related to the visual appearance of the
     * tag has changed.
     *
     * @event Tag#changed
     * @type {Tag} The tag instance that has changed.
     */
    public static changed: string = "changed";

    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event Tag#geometrychanged
     * @type {Tag} The tag instance whose geometry has changed.
     */
    public static geometrychanged: string = "geometrychanged";

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
                    this.fire(Tag.changed, this);
                });

        this._geometry.changed$
            .subscribe(
                (g: Geometry): void => {
                    this.fire(Tag.geometrychanged, this);
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
                (geometry: Geometry): Tag => {
                    return this;
                }),
            share());
    }
}

export default Tag;
