import { ViewerOptions } from "./options/ViewerOptions";

export class ViewerConfiguration {
    private static _exploreHost: string = "www.mapillary.com";
    private static _scheme: string = "https";
    private static _imageTiling: boolean = true;

    public static get explore(): string {
        const scheme = ViewerConfiguration._scheme;
        const host = ViewerConfiguration._exploreHost;
        return `${scheme}://${host}`;
    }

    public static get imageTiling(): boolean {
        return ViewerConfiguration._imageTiling;
    }

    public static exploreImage(id: string): string {
        return `${ViewerConfiguration.explore}/app/?pKey=${id}&focus=photo`;
    }

    public static exploreUser(username: string): string {
        return `${ViewerConfiguration.explore}/app/user/${username}`;
    }

    public static setOptions(options: ViewerOptions): void {
        if (!options) { return; }
        if (options.imageTiling === false) {
            ViewerConfiguration._imageTiling = false;
        }

        if (!options.url) { return; }
        if (!!options.url.exploreHost) {
            ViewerConfiguration._exploreHost = options.url.exploreHost;
        }
        if (!!options.url.scheme) {
            ViewerConfiguration._scheme = options.url.scheme;
        }
    }
}
