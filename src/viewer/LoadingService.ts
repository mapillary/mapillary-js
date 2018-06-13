import {map, distinctUntilChanged, debounceTime, refCount, publishReplay, scan, startWith} from "rxjs/operators";
import {Observable, Subject} from "rxjs";

interface ILoader {
    task: string;
    loading: boolean;
}

export class LoadingService {
    private _loaders$: Observable<{[key: string]: boolean}>;
    private _loadersSubject$: Subject<any> = new Subject<any>();

    constructor () {
        this._loaders$ = this._loadersSubject$.pipe(
            scan(
                (loaders: {[key: string]: boolean}, loader: ILoader): {[key: string]: boolean} => {
                    if (loader.task !== undefined) {
                        loaders[loader.task] = loader.loading;
                    }
                    return loaders;
                },
                {}),
            startWith({}),
            publishReplay(1),
            refCount());
    }

    public get loading$(): Observable<boolean> {
        return this._loaders$.pipe(
            map(
                (loaders: {[key: string]: boolean}): boolean => {
                    for (const key in loaders) {
                        if (!loaders.hasOwnProperty(key)) {
                            continue;
                        }

                        if (loaders[key]) {
                            return true;
                        }
                    }

                    return false;
                }),
            debounceTime(100),
            distinctUntilChanged());
    }

    public taskLoading$(task: string): Observable<boolean> {
        return this._loaders$.pipe(
            map(
                (loaders: {[key: string]: boolean}): boolean => {
                    return !!loaders[task];
                }),
            debounceTime(100),
            distinctUntilChanged());
    }

    public startLoading(task: string): void {
        this._loadersSubject$.next({loading: true, task: task});
    }

    public stopLoading(task: string): void {
        this._loadersSubject$.next({loading: false, task: task});
    }
}

export default LoadingService;
