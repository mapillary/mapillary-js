import {IUrlOptions} from "../Viewer";

export class Urls {
    private static _apiHost: string = "a.mapillary.com";
    private static _atomicReconstructionHost: string = "d3necqxnn15whe.cloudfront.net";
    private static _exploreHost: string = "www.mapillary.com";
    private static _imageHost: string = "d1cuyjsrcm0gby.cloudfront.net";
    private static _imageTileHost: string = "d2qb1440i7l50o.cloudfront.net";
    private static _meshHost: string = "d1brzeo354iq2l.cloudfront.net";
    private static _origin: string = "mapillary.webgl";
    private static _scheme: string = "https";

    public static get explore(): string {
        return `${Urls._scheme}://${Urls._exploreHost}`;
    }

    public static get origin(): string {
        return Urls._origin;
    }

    public static get tileScheme(): string {
        return Urls._scheme;
    }

    public static get tileDomain(): string {
        return Urls._imageTileHost;
    }

    public static atomicReconstruction(key: string): string {
        return `${Urls._scheme}://${Urls._atomicReconstructionHost}/${key}/sfm/v1.0/atomic_reconstruction.json`;
    }

    public static exporeImage(key: string): string {
        return `${Urls._scheme}://${Urls._exploreHost}/app/?pKey=${key}&focus=photo`;
    }

    public static exporeUser(username: string): string {
        return `${Urls._scheme}://${Urls._exploreHost}/app/user/${username}`;
    }

    public static falcorModel(clientId: string): string {
        return `${Urls._scheme}://${Urls._apiHost}/v3/model.json?client_id=${clientId}`;
    }

    public static protoMesh(key: string): string {
        return `${Urls._scheme}://${Urls._meshHost}/v2/mesh/${key}`;
    }

    public static thumbnail(key: string, size: number, origin?: string): string {
        const query: string = !!origin ? `?origin=${origin}` : "";

        return `${Urls._scheme}://${Urls._imageHost}/${key}/thumb-${size}.jpg${query}`;
    }

    public static setOptions(options: IUrlOptions): void {
        if (!options) {
            return;
        }

        if (!!options.apiHost) {
            Urls._apiHost = options.apiHost;
        }

        if (!!options.atomicReconstructionHost) {
            Urls._atomicReconstructionHost = options.atomicReconstructionHost;
        }

        if (!!options.exploreHost) {
            Urls._exploreHost = options.exploreHost;
        }

        if (!!options.imageHost) {
            Urls._imageHost = options.imageHost;
        }

        if (!!options.imageTileHost) {
            Urls._imageTileHost = options.imageTileHost;
        }

        if (!!options.meshHost) {
            Urls._meshHost = options.meshHost;
        }

        if (!!options.scheme) {
            Urls._scheme = options.scheme;
        }
    }
}

export default Urls;
