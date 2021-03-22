import { UrlOptions } from "../viewer/options/UrlOptions";

export class Urls {
    private static _exploreHost: string = "www.mapillary.com";
    private static _scheme: string = "https";

    public static get explore(): string {
        return `${Urls._scheme}://${Urls._exploreHost}`;
    }

    public static exploreImage(id: string): string {
        return `${Urls._scheme}://${Urls._exploreHost}/app/?pKey=${id}&focus=photo`;
    }

    public static exploreUser(username: string): string {
        return `${Urls._scheme}://${Urls._exploreHost}/app/user/${username}`;
    }

    public static setOptions(options: UrlOptions): void {
        if (!options) {
            return;
        }

        if (!!options.exploreHost) {
            Urls._exploreHost = options.exploreHost;
        }

        if (!!options.scheme) {
            Urls._scheme = options.scheme;
        }
    }
}
