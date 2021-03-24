import { FalcorDataProviderOptions } from "./FalcorDataProviderOptions";

export class FalcorDataProviderUrls {
    private _apiHost: string = "a.mapillary.com";
    private _clientToken: string;
    private _clusterReconstructionHost: string =
        "cluster-reconstructions.mapillary.com";
    private _imageHost: string = "images.mapillary.com";
    private _imageTileHost: string = "loris.mapillary.com";
    private _meshHost: string = "meshes.mapillary.com";
    private _origin: string = "mapillary.webgl";
    private _scheme: string = "https";

    /**
     * Create a new Falcor data provider URLs instance.
     *
     * @param {FalcorDataProviderOptions} options - Options struct.
     */
    constructor(options: FalcorDataProviderOptions) {
        this._clientToken = options.clientToken;

        if (!!options.apiHost) {
            this._apiHost = options.apiHost;
        }

        if (!!options.reconstructionHost) {
            this._clusterReconstructionHost = options.reconstructionHost;
        }

        if (!!options.imageHost) {
            this._imageHost = options.imageHost;
        }

        if (!!options.imageTileHost) {
            this._imageTileHost = options.imageTileHost;
        }

        if (!!options.meshHost) {
            this._meshHost = options.meshHost;
        }

        if (!!options.scheme) {
            this._scheme = options.scheme;
        }
    }

    public get falcorModel(): string {
        return `${this._scheme}://${this._apiHost}/v3/model.json?client_id=${this._clientToken}`;
    }

    public get origin(): string {
        return this._origin;
    }

    public get tileScheme(): string {
        return this._scheme;
    }

    public get tileDomain(): string {
        return this._imageTileHost;
    }

    public clusterReconstruction(clusterId: string): string {
        return `${this._scheme}://${this._clusterReconstructionHost}/${clusterId}/v1.0/aligned.jsonz`;
    }

    public imageTile(
        imageId: string,
        coords: string,
        size: string): string {
        return `${this.tileScheme}://${this.tileDomain}/${imageId}/${coords}/${size}/0/default.jpg`;
    }

    public protoMesh(imageId: string): string {
        return `${this._scheme}://${this._meshHost}/v2/mesh/${imageId}`;
    }

    public thumbnail(
        imageId: string,
        size: number,
        origin?: string): string {
        const query: string = !!origin ? `?origin=${origin}` : "";

        return `${this._scheme}://${this._imageHost}/${imageId}/thumb-${size}.jpg${query}`;
    }
}
