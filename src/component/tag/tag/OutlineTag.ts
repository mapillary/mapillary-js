import {Subject} from "rxjs/Subject";

import {
    Alignment,
    IOutlineTagOptions,
    Tag,
    VertexGeometry,
} from "../../../Component";

/**
 * @class OutlineTag
 * @classdesc Tag holding properties for visualizing a geometry outline.
 */
export class OutlineTag extends Tag {
    /**
     * Event fired when the icon of the outline tag is clicked.
     *
     * @event OutlineTag#click
     * @type {OutlineTag} The tag instance that was clicked.
     */
    public static click: string = "click";

    protected _geometry: VertexGeometry;

    private _editable: boolean;
    private _icon: string;
    private _iconAlignment: Alignment;
    private _iconIndex: number;
    private _indicateVertices: boolean;
    private _lineColor: number;
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
     * @param {string} id
     * @param {Geometry} geometry
     * @param {IOutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the outline tag.
     */
    constructor(id: string, geometry: VertexGeometry, options: IOutlineTagOptions) {
        super(id, geometry);

        this._editable = options.editable == null ? false : options.editable;
        this._fillColor = options.fillColor == null ? 0xFFFFFF : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? 0.0 : options.fillOpacity;
        this._icon = options.icon === undefined ? null : options.icon;
        this._iconAlignment = options.iconAlignment == null ? Alignment.Outer : options.iconAlignment;
        this._iconIndex = options.iconIndex == null ? 3 : options.iconIndex;
        this._indicateVertices = options.indicateVertices == null ? true : options.indicateVertices;
        this._lineColor = options.lineColor == null ? 0xFFFFFF : options.lineColor;
        this._lineWidth = options.lineWidth == null ? 1 : options.lineWidth;
        this._text = options.text === undefined ? null : options.text;
        this._textColor = options.textColor == null ? 0xFFFFFF : options.textColor;

        this._click$ = new Subject<OutlineTag>();

        this._click$
            .subscribe(
                (t: Tag): void => {
                    this.fire(OutlineTag.click, this);
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
     * @fires Tag#changed
     */
    public set editable(value: boolean) {
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
     * @fires Tag#changed
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
     * @fires Tag#changed
     */
    public set fillOpacity(value: number) {
        this._fillOpacity = value;
        this._notifyChanged$.next(this);
    }

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
     * @fires Tag#changed
     */
    public set icon(value: string) {
        this._icon = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Get icon alignment property.
     * @returns {Alignment}
     */
    public get iconAlignment(): Alignment {
        return this._iconAlignment;
    }

    /**
     * Set icon alignment property.
     * @param {Alignment}
     *
     * @fires Tag#changed
     */
    public set iconAlignment(value: Alignment) {
        this._iconAlignment = value;
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
     * @fires Tag#changed
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
     * @fires Tag#changed
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
     * @fires Tag#changed
     */
    public set lineColor(value: number) {
        this._lineColor = value;
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
     * @fires Tag#changed
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
     * @fires Tag#changed
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
     * @fires Tag#changed
     */
    public set textColor(value: number) {
        this._textColor = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keps
     * the rest of the values as is.
     *
     * @param {IOutlineTagOptions} options - Outline tag options
     *
     * @fires {Tag#changed}
     */
    public setOptions(options: IOutlineTagOptions): void {
        this._editable = options.editable == null ? this._editable : options.editable;
        this._icon = options.icon === undefined ? this._icon : options.icon;
        this._iconAlignment = options.iconAlignment == null ? this._iconAlignment : options.iconAlignment;
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
}

export default OutlineTag;
