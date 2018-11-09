import {IDirectionConfiguration} from "../../Component";
import {Spatial} from "../../Geo";
import {ISize} from "../../Render";

/**
 * @class DirectionDOMCalculator
 * @classdesc Helper class for calculating DOM CSS properties.
 */
export class DirectionDOMCalculator {
    private _spatial: Spatial;

    private _elementWidth: number;
    private _elementHeight: number;

    private _minWidth: number;
    private _maxWidth: number;

    private _minThresholdWidth: number;
    private _maxThresholdWidth: number;
    private _minThresholdHeight: number;
    private _maxThresholdHeight: number;

    private _containerWidth: number;
    private _containerWidthCss: string;
    private _containerMarginCss: string;
    private _containerLeftCss: string;
    private _containerHeight: number;
    private _containerHeightCss: string;
    private _containerBottomCss: string;

    private _stepCircleSize: number;
    private _stepCircleSizeCss: string;
    private _stepCircleMarginCss: string;

    private _turnCircleSize: number;
    private _turnCircleSizeCss: string;

    private _outerRadius: number;
    private _innerRadius: number;

    private _shadowOffset: number;

    constructor(configuration: IDirectionConfiguration, size: ISize) {
        this._spatial = new Spatial();

        this._minThresholdWidth = 320;
        this._maxThresholdWidth = 1480;
        this._minThresholdHeight = 240;
        this._maxThresholdHeight = 820;

        this._configure(configuration);
        this._resize(size);
        this._reset();
    }

    public get minWidth(): number {
        return this._minWidth;
    }

    public get maxWidth(): number {
        return this._maxWidth;
    }

    public get containerWidth(): number {
        return this._containerWidth;
    }

    public get containerWidthCss(): string {
        return this._containerWidthCss;
    }

    public get containerMarginCss(): string {
        return this._containerMarginCss;
    }

    public get containerLeftCss(): string {
        return this._containerLeftCss;
    }

    public get containerHeight(): number {
        return this._containerHeight;
    }

    public get containerHeightCss(): string {
        return this._containerHeightCss;
    }

    public get containerBottomCss(): string {
        return this._containerBottomCss;
    }

    public get stepCircleSize(): number {
        return this._stepCircleSize;
    }

    public get stepCircleSizeCss(): string {
        return this._stepCircleSizeCss;
    }

    public get stepCircleMarginCss(): string {
        return this._stepCircleMarginCss;
    }

    public get turnCircleSize(): number {
        return this._turnCircleSize;
    }

    public get turnCircleSizeCss(): string {
        return this._turnCircleSizeCss;
    }

    public get outerRadius(): number {
        return this._outerRadius;
    }

    public get innerRadius(): number {
        return this._innerRadius;
    }

    public get shadowOffset(): number {
        return this._shadowOffset;
    }

    /**
     * Configures the min and max width values.
     *
     * @param {IDirectionConfiguration} configuration Configuration
     * with min and max width values.
     */
    public configure(configuration: IDirectionConfiguration): void {
        this._configure(configuration);
        this._reset();
    }

    /**
     * Resizes all properties according to the width and height
     * of the size object.
     *
     * @param {ISize} size The size of the container element.
     */
    public resize(size: ISize): void {
        this._resize(size);
        this._reset();
    }

    /**
     * Calculates the coordinates on the unit circle for an angle.
     *
     * @param {number} angle Angle in radians.
     * @returns {Array<number>} The x and y coordinates on the unit circle.
     */
    public angleToCoordinates(angle: number): number[] {
        return [Math.cos(angle), Math.sin(angle)];
    }

    /**
     * Calculates the coordinates on the unit circle for the
     * relative angle between the first and second angle.
     *
     * @param {number} first Angle in radians.
     * @param {number} second Angle in radians.
     * @returns {Array<number>} The x and y coordinates on the unit circle
     * for the relative angle between the first and second angle.
     */
    public relativeAngleToCoordiantes(first: number, second: number): number[] {
        let relativeAngle: number = this._spatial.wrapAngle(first - second);

        return this.angleToCoordinates(relativeAngle);
    }

    private _configure(configuration: IDirectionConfiguration): void {
        this._minWidth = configuration.minWidth;
        this._maxWidth = this._getMaxWidth(configuration.minWidth, configuration.maxWidth);
    }

    private _resize(size: ISize): void {
        this._elementWidth = size.width;
        this._elementHeight = size.height;
    }

    private _reset(): void {
        this._containerWidth = this._getContainerWidth(this._elementWidth, this._elementHeight);
        this._containerHeight = this._getContainerHeight(this.containerWidth);
        this._stepCircleSize = this._getStepCircleDiameter(this._containerHeight);
        this._turnCircleSize = this._getTurnCircleDiameter(this.containerHeight);
        this._outerRadius = this._getOuterRadius(this._containerHeight);
        this._innerRadius = this._getInnerRadius(this._containerHeight);

        this._shadowOffset = 3;

        this._containerWidthCss = this._numberToCssPixels(this._containerWidth);
        this._containerMarginCss = this._numberToCssPixels(-0.5 * this._containerWidth);
        this._containerLeftCss = this._numberToCssPixels(Math.floor(0.5 * this._elementWidth));
        this._containerHeightCss = this._numberToCssPixels(this._containerHeight);
        this._containerBottomCss = this._numberToCssPixels(Math.floor(-0.08 * this._containerHeight));
        this._stepCircleSizeCss = this._numberToCssPixels(this._stepCircleSize);
        this._stepCircleMarginCss = this._numberToCssPixels(-0.5 * this._stepCircleSize);
        this._turnCircleSizeCss = this._numberToCssPixels(this._turnCircleSize);
    }

    private _getContainerWidth(elementWidth: number, elementHeight: number): number {
        let relativeWidth: number =
            (elementWidth - this._minThresholdWidth) / (this._maxThresholdWidth - this._minThresholdWidth);
        let relativeHeight: number =
            (elementHeight - this._minThresholdHeight) / (this._maxThresholdHeight - this._minThresholdHeight);

        let coeff: number = Math.max(0, Math.min(1, Math.min(relativeWidth, relativeHeight)));

        coeff = 0.04 * Math.round(25 * coeff);

        return this._minWidth + coeff * (this._maxWidth - this._minWidth);
    }

    private _getContainerHeight(containerWidth: number): number {
        return 0.77 * containerWidth;
    }

    private _getStepCircleDiameter(containerHeight: number): number {
        return 0.34 * containerHeight;
    }

    private _getTurnCircleDiameter(containerHeight: number): number {
        return 0.3 * containerHeight;
    }

    private _getOuterRadius(containerHeight: number): number {
        return 0.31 * containerHeight;
    }

    private _getInnerRadius(containerHeight: number): number {
        return 0.125 * containerHeight;
    }

    private _numberToCssPixels(value: number): string {
        return value + "px";
    }

    private _getMaxWidth(value: number, minWidth: number): number {
        return value > minWidth ? value : minWidth;
    }
}

export default DirectionDOMCalculator;
