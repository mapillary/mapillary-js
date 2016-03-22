export class MapillaryRect {
    private _capturedAt: number;
    private _imageKey: string;
    private _rectKey: string;

    constructor(capturedAt: number, imageKey: string, rectKey: string) {
        this._capturedAt = capturedAt;
        this._imageKey = imageKey;
        this._rectKey = rectKey;
    }

    public get capturedAt(): number {
        return this._capturedAt;
    }

    public get imageKey(): string {
        return this._imageKey;
    }

    public get rectKey(): string {
        return this._rectKey;
    }
}

export default MapillaryRect;
