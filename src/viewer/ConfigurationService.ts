import {
    Observable,
    of as observableOf,
} from "rxjs";

import { ViewerOptions } from "../external/viewer";

export class ConfigurationService {
    private _imageTiling$: Observable<boolean>;
    private _exploreUrl$: Observable<string>;

    constructor(options: ViewerOptions) {
        const host = options?.url?.exploreHost ?? "www.mapillary.com";
        const scheme = options?.url?.scheme ?? "https";
        const exploreUrl = `${scheme}://${host}`;
        this._exploreUrl$ = observableOf(exploreUrl);

        const imageTiling = options?.imageTiling === false ? false : true;
        this._imageTiling$ = observableOf(imageTiling);
    }

    public get exploreUrl$(): Observable<string> {
        return this._exploreUrl$;
    }

    public get imageTiling$(): Observable<boolean> {
        return this._imageTiling$;
    }
}
