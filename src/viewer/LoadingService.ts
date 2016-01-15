/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

interface ILoader {
    task: string;
    loading: boolean;
}

export class LoadingService {
    public loaders: rx.Observable<{[key: string]: boolean}>;

    private loadersSubject: rx.Subject<any> = new rx.Subject<any>();

    constructor () {
        this.loaders = this.loadersSubject
            .scan<{[key: string]: boolean}>(
                (loaders: {[key: string]: boolean}, loader: ILoader): {[key: string]: boolean} => {
                    if (loader.task !== undefined) {
                        loaders[loader.task] = loader.loading;
                    }
                    return loaders;
                },
                {})
            .startWith({}).shareReplay(1);
    }

    public loading(): rx.Observable<boolean> {
        return this.loaders.map((loaders: {[key: string]: boolean}): boolean => {
            return _.reduce(
                loaders,
                (loader: boolean, acc: boolean) => {
                    return (loader || acc);
                },
                false);
        }).distinctUntilChanged();
    }

    public taskLoading(task: string): rx.Observable<boolean> {
        return this.loaders.map((loaders: {[key: string]: boolean}): boolean => {
            return !!loaders[task];
        }).sample(rx.Observable.interval(50)).distinctUntilChanged();
    }

    public startLoading(task: string): void {
        this.loadersSubject.onNext({loading: true, task: task});
    }

    public stopLoading(task: string): void {
        this.loadersSubject.onNext({loading: false, task: task});
    }
}

export default LoadingService
