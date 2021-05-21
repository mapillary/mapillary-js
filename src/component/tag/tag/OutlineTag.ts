import { Subject } from "rxjs";
import { Alignment } from "../../../viewer/enums/Alignment";

import { PolygonGeometry } from "../geometry/PolygonGeometry";
import { VertexGeometry } from "../geometry/VertexGeometry";
import { OutlineTagOptions } from "../interfaces/OutlineTagOptions";

import { Tag } from "./Tag";
import { TagDomain } from "./TagDomain";
import { TagEventType } from "./events/TagEventType";
import { TagStateEvent } from "./events/TagStateEvent";

/**
 * @class OutlineTag
 *
 * @classdesc Tag holding properties for visualizing a geometry outline.
 *
 * @example
 * ```js
 * var geometry = new RectGeometry([0.3, 0.3, 0.5, 0.4]);
 * var tag = new OutlineTag(
 *     "id-1",
 *     geometry
 *     { editable: true, lineColor: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
export class OutlineTag extends Tag {
    protected _geometry: VertexGeometry;

    private _domain: TagDomain;
    private _editable: boolean;
    private _icon: string;
    private _iconFloat: Alignment;
    private _iconIndex: number;
    private _indicateVertices: boolean;
    private _lineColor: number;
    private _lineOpacity: number;
    private _lineWidth: number;
    private _fillColor: number;
    private _fillOpacity: number;
    private _text: string;
    private _textColor: number;

    private _click$: Subject<OutlineTag>;

    /**
     * Create an outline tag.
     *
     * @override
     * @constructor
     * @param {string} id - Unique identifier of the tag.
     * @param {VertexGeometry} geometry - Geometry defining vertices of tag.
     * @param {OutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the outline tag.
     */
    constructor(id: string, geometry: VertexGeometry, options?: OutlineTagOptions) {
        super(id, geometry);

        options = !!options ? options : {};

        const domain: TagDomain = options.domain != null && geometry instanceof PolygonGeometry ?
            options.domain : TagDomain.TwoDimensional;

        const twoDimensionalPolygon: boolean = this._twoDimensionalPolygon(domain, geometry);

        this._domain = domain;
        this._editable = options.editable == null || twoDimensionalPolygon ? false : options.editable;
        this._fillColor = options.fillColor == null ? 0xFFFFFF : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? 0.0 : options.fillOpacity;
        this._icon = options.icon === undefined ? null : options.icon;
        this._iconFloat = options.iconFloat == null ? Alignment.Center : options.iconFloat;
        this._iconIndex = options.iconIndex == null ? 3 : options.iconIndex;
        this._indicateVertices = options.indicateVertices == null ? true : options.indicateVertices;
        this._lineColor = options.lineColor == null ? 0xFFFFFF : options.lineColor;
        this._lineOpacity = options.lineOpacity == null ? 1 : options.lineOpacity;
        this._lineWidth = options.lineWidth == null ? 1 : options.lineWidth;
        this._text = options.text === undefined ? null : options.text;
        this._textColor = options.textColor == null ? 0xFFFFFF : options.textColor;

        this._click$ = new Subject<OutlineTag>();

        this._click$
            .subscribe(
                (): void => {
                    const type: TagEventType = "click";
                    const event: TagStateEvent = {
                        target: this,
                        type,
                    };
                    this.fire(type, event);
                });
    }

    /**
     * Click observable.
     *
     * @description An observable emitting the tag when the icon of the
     * tag has been clicked.
     *
     * @returns {Observable<Tag>}
     */
    public get click$(): Subject<OutlineTag> {
        return this._click$;
    }

    /**
     * Get domain property.
     *
     * @description Readonly property that can only be set in constructor.
     *
     * @returns Value indicating the domain of the tag.
     */
    public get domain(): TagDomain {
        return this._domain;
    }

    /**
     * Get editable property.
     * @returns {boolean} Value indicating if tag is editable.
     */
    public get editable(): boolean {
        return this._editable;
    }

    /**
     * Set editable property.
     * @param {boolean}
     *
     * @fires changed
     */
    public set editable(value: boolean) {
        if (this._twoDimensionalPolygon(this._domain, this._geometry)) {
            return;
        }

        this._editable = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get fill color property.
     * @returns {number}
     */
    public get fillColor(): number {
        return this._fillColor;
    }

    /**
     * Set fill color property.
     * @param {number}
     *
     * @fires changed
     */
    public set fillColor(value: number) {
        this._fillColor = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get fill opacity property.
     * @returns {number}
     */
    public get fillOpacity(): number {
        return this._fillOpacity;
    }

    /**
     * Set fill opacity property.
     * @param {number}
     *
     * @fires changed
     */
    public set fillOpacity(value: number) {
        this._fillOpacity = value;
        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public get geometry(): VertexGeometry {
        return this._geometry;
    }

    /**
     * Get icon property.
     * @returns {string}
     */
    public get icon(): string {
        return this._icon;
    }

    /**
     * Set icon property.
     * @param {string}
     *
     * @fires changed
     */
    public set icon(value: string) {
        this._icon = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get icon float property.
     * @returns {Alignment}
     */
    public get iconFloat(): Alignment {
        return this._iconFloat;
    }

    /**
     * Set icon float property.
     * @param {Alignment}
     *
     * @fires changed
     */
    public set iconFloat(value: Alignment) {
        this._iconFloat = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get icon index property.
     * @returns {number}
     */
    public get iconIndex(): number {
        return this._iconIndex;
    }

    /**
     * Set icon index property.
     * @param {number}
     *
     * @fires changed
     */
    public set iconIndex(value: number) {
        this._iconIndex = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get indicate vertices property.
     * @returns {boolean} Value indicating if vertices should be indicated
     * when tag is editable.
     */
    public get indicateVertices(): boolean {
        return this._indicateVertices;
    }

    /**
     * Set indicate vertices property.
     * @param {boolean}
     *
     * @fires changed
     */
    public set indicateVertices(value: boolean) {
        this._indicateVertices = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get line color property.
     * @returns {number}
     */
    public get lineColor(): number {
        return this._lineColor;
    }

    /**
     * Set line color property.
     * @param {number}
     *
     * @fires changed
     */
    public set lineColor(value: number) {
        this._lineColor = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get line opacity property.
     * @returns {number}
     */
    public get lineOpacity(): number {
        return this._lineOpacity;
    }

    /**
     * Set line opacity property.
     * @param {number}
     *
     * @fires changed
     */
    public set lineOpacity(value: number) {
        this._lineOpacity = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get line width property.
     * @returns {number}
     */
    public get lineWidth(): number {
        return this._lineWidth;
    }

    /**
     * Set line width property.
     * @param {number}
     *
     * @fires changed
     */
    public set lineWidth(value: number) {
        this._lineWidth = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get text property.
     * @returns {string}
     */
    public get text(): string {
        return this._text;
    }

    /**
     * Set text property.
     * @param {string}
     *
     * @fires changed
     */
    public set text(value: string) {
        this._text = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get text color property.
     * @returns {number}
     */
    public get textColor(): number {
        return this._textColor;
    }

    /**
     * Set text color property.
     * @param {number}
     *
     * @fires changed
     */
    public set textColor(value: number) {
        this._textColor = value;
        this._notifyChanged$.next(this);
    }

    public fire(
        type: TagStateEvent["type"],
        event: TagStateEvent)
        : void;
    /** @ignore */
    public fire(
        type: TagEventType,
        event: TagStateEvent)
        : void;
    public fire(
        type: TagEventType,
        event: TagStateEvent)
        : void {
        super.fire(type, event);
    }

    public off(
        type: TagStateEvent["type"],
        handler: (event: TagStateEvent) => void)
        : void;
    /** @ignore */
    public off(
        type: TagEventType,
        handler: (event: TagStateEvent) => void)
        : void;
    public off(
        type: TagEventType,
        handler: (event: TagStateEvent) => void)
        : void {
        super.off(type, handler);
    }

    /**
     * Event fired when the icon of the outline tag is clicked.
     *
     * @event click
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('click', function() {
     *   console.log("A click event has occurred.");
     * });
     * ```
     */
    public on(
        type: "click",
        handler: (event: TagStateEvent) => void)
        : void;
    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event geometry
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('geometry', function() {
     *   console.log("A geometry event has occurred.");
     * });
     * ```
     */
    public on(
        type: "geometry",
        handler: (event: TagStateEvent) => void)
        : void;
    /**
     * Event fired when a tag has been updated.
     *
     * @event tag
     * @example
     * ```js
     * var tag = new OutlineTag({ // tag options });
     * // Set an event listener
     * tag.on('tag', function() {
     *   console.log("A tag event has occurred.");
     * });
     * ```
     */
    public on(
        type: "tag",
        handler: (event: TagStateEvent) => void)
        : void;
    public on(
        type: TagEventType,
        handler: (event: TagStateEvent) => void)
        : void {
        super.on(type, handler);
    }

    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keeps
     * the rest of the values as is.
     *
     * @param {OutlineTagOptions} options - Outline tag options
     *
     * @fires changed
     */
    public setOptions(options: OutlineTagOptions): void {
        const twoDimensionalPolygon: boolean = this._twoDimensionalPolygon(this._domain, this._geometry);

        this._editable = twoDimensionalPolygon || options.editable == null ? this._editable : options.editable;
        this._icon = options.icon === undefined ? this._icon : options.icon;
        this._iconFloat = options.iconFloat == null ? this._iconFloat : options.iconFloat;
        this._iconIndex = options.iconIndex == null ? this._iconIndex : options.iconIndex;
        this._indicateVertices = options.indicateVertices == null ? this._indicateVertices : options.indicateVertices;
        this._lineColor = options.lineColor == null ? this._lineColor : options.lineColor;
        this._lineWidth = options.lineWidth == null ? this._lineWidth : options.lineWidth;
        this._fillColor = options.fillColor == null ? this._fillColor : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? this._fillOpacity : options.fillOpacity;
        this._text = options.text === undefined ? this._text : options.text;
        this._textColor = options.textColor == null ? this._textColor : options.textColor;
        this._notifyChanged$.next(this);
    }

    private _twoDimensionalPolygon(domain: TagDomain, geometry: VertexGeometry): boolean {
        return domain !== TagDomain.ThreeDimensional && geometry instanceof PolygonGeometry;
    }
}
