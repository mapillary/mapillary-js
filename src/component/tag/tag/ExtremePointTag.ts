import {
    Tag,
    IExtremePointTagOptions,
} from "../../../Component";
import PointsGeometry from "../geometry/PointsGeometry";

/**
 * @class ExtremePointTag
 *
 * @classdesc Tag holding properties for visualizing a extreme points
 * and their outline.
 *
 * @example
 * ```
 * var geometry = new Mapillary.TagComponent.PointsGeometry([[0.3, 0.3], [0.5, 0.4]]);
 * var tag = new Mapillary.TagComponent.ExtremePointTag(
 *     "id-1",
 *     geometry
 *     { editable: true, lineColor: 0xff0000 });
 *
 * tagComponent.add([tag]);
 * ```
 */
export class ExtremePointTag extends Tag {
    protected _geometry: PointsGeometry;

    private _editable: boolean;
    private _indicateVertices: boolean;
    private _lineColor: number;
    private _lineOpacity: number;
    private _lineWidth: number;
    private _fillColor: number;
    private _fillOpacity: number;

    /**
     * Create an extreme point tag.
     *
     * @override
     * @constructor
     * @param {string} id - Unique identifier of the tag.
     * @param {PointsGeometry} geometry - Geometry defining points of tag.
     * @param {IExtremePointTagOptions} options - Options defining the visual appearance and
     * behavior of the extreme point tag.
     */
    constructor(id: string, geometry: PointsGeometry, options?: IExtremePointTagOptions) {
        super(id, geometry);

        options = !!options ? options : {};

        this._editable = options.editable == null ? false : options.editable;
        this._fillColor = options.fillColor == null ? 0xFFFFFF : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? 0.0 : options.fillOpacity;
        this._indicateVertices = options.indicateVertices == null ? true : options.indicateVertices;
        this._lineColor = options.lineColor == null ? 0xFFFFFF : options.lineColor;
        this._lineOpacity = options.lineOpacity == null ? 1 : options.lineOpacity;
        this._lineWidth = options.lineWidth == null ? 1 : options.lineWidth;
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

    /** @inheritdoc */
    public get geometry(): PointsGeometry {
        return this._geometry;
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
     * @fires Tag#changed
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
     * @fires Tag#changed
     */
    public set lineWidth(value: number) {
        this._lineWidth = value;
        this._notifyChanged$.next(this);
    }

    /**
     * Set options for tag.
     *
     * @description Sets all the option properties provided and keeps
     * the rest of the values as is.
     *
     * @param {IExtremePointTagOptions} options - Extreme point tag options
     *
     * @fires {Tag#changed}
     */
    public setOptions(options: IExtremePointTagOptions): void {
        this._editable = options.editable == null ? this._editable : options.editable;
        this._indicateVertices = options.indicateVertices == null ? this._indicateVertices : options.indicateVertices;
        this._lineColor = options.lineColor == null ? this._lineColor : options.lineColor;
        this._lineWidth = options.lineWidth == null ? this._lineWidth : options.lineWidth;
        this._fillColor = options.fillColor == null ? this._fillColor : options.fillColor;
        this._fillOpacity = options.fillOpacity == null ? this._fillOpacity : options.fillOpacity;
        this._notifyChanged$.next(this);
    }
}

export default ExtremePointTag;
