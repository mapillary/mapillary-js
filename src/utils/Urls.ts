import {IUrlOptions} from "../Viewer";

export class Urls {
    private static _apiHost: string = "a.mapillary.com";
    private static _clusterReconstructionHost: string = "cluster-reconstructions.mapillary.com";
    private static _exploreHost: string = "www.mapillary.com";
    private static _imageHost: string = "images.mapillary.com";
    private static _imageTileHost: string = "loris.mapillary.com";
    private static _meshHost: string = "meshes.mapillary.com";
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

    public static clusterReconstruction(key: string): string {
        return `${Urls._scheme}://${Urls._clusterReconstructionHost}/${key}/v1.0/aligned.jsonz`;
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

        if (!!options.clusterReconstructionHost) {
            Urls._clusterReconstructionHost = options.clusterReconstructionHost;
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
