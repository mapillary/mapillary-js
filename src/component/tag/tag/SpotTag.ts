import {
    Geometry,
    ISpotTagOptions,
    Tag,
} from "../../../Component";

/**
 * @class SpotTag
 *
 * @classdesc Tag holding properties for visualizing the centroid of a geometry.
 *
 * @example
 * ```
 * var geometry = new Mapillary.TagComponent.PointGeometry([0.3, 0.3]);
 * var tag = new Mapillary.TagComponent.SpotTag(
 *     "id-1",
 *     geometry
 *     { editable: true, color: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
export class SpotTag extends Tag {
    protected _geometry: Geometry;

    private _color: number;
    private _editable: boolean;
    private _icon: string;
    private _text: string;
    private _textColor: number;

    /**
     * Create a spot tag.
     *
     * @override
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     * @param {IOutlineTagOptions} options - Options defining the visual appearance and
     * behavior of the spot tag.
     */
    constructor(id: string, geometry: Geometry, options?: ISpotTagOptions) {
        super(id, geometry);

        options = !!options ? options : {};

        this._color = options.color == null ? 0xFFFFFF : options.color;
        this._editable = options.editable == null ? false : options.editable;
        this._icon = options.icon === undefined ? null : options.icon;
        this._text = options.text === undefined ? null : options.text;
        this._textColor = options.textColor == null ? 0xFFFFFF : options.textColor;
    }

    /**
     * Get color property.
     * @returns {number} The color of the spot as a hexagonal number;
     */
    public get color(): number {
        return this._color;
    }

    /**
     * Set color property.
     * @param {number}
     *
     * @fires Tag#changed
     */
    public set color(value: number) {
        this._color = value;
        this._notifyChanged$.next(this);
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
     * @param {ISpotTagOptions} options - Spot tag options
     *
     * @fires {Tag#changed}
     */
    public setOptions(options: ISpotTagOptions): void {
        this._color = options.color == null ? this._color : options.color;
        this._editable = options.editable == null ? this._editable : options.editable;
        this._icon = options.icon === undefined ? this._icon : options.icon;
        this._text = options.text === undefined ? this._text : options.text;
        this._textColor = options.textColor == null ? this._textColor : options.textColor;
        this._notifyChanged$.next(this);
    }
}

export default SpotTag;
