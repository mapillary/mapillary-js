import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";
import "rxjs/add/operator/withLatestFrom";

import {
    ITagConfiguration,
    OutlineCreateTag,
    PolygonGeometry,
    RectGeometry,
} from "../../Component";

interface ICreateTagOperation {
    (tag: OutlineCreateTag): OutlineCreateTag;
}

export class TagCreator {
    private _tagOperation$: Subject<ICreateTagOperation>;
    private _tag$: Observable<OutlineCreateTag>;

    private _create$: Subject<number[]>;
    private _delete$: Subject<void>;

    private _configuration$: Subject<ITagConfiguration>;

    constructor() {
        this._tagOperation$ = new Subject<ICreateTagOperation>();
        this._create$ = new Subject<number[]>();
        this._delete$ = new Subject<void>();

        this._configuration$ = new Subject<ITagConfiguration>();

        this._tag$ = this._tagOperation$
            .scan<OutlineCreateTag>(
                (tag: OutlineCreateTag, operation: ICreateTagOperation): OutlineCreateTag => {
                    return operation(tag);
                },
                null)
            .share();

        this._create$
            .withLatestFrom(
                this._configuration$,
                (coordinate: number[], type: ITagConfiguration): [number[], ITagConfiguration] => {
                    return [coordinate, type];
                })
            .map<ICreateTagOperation>(
                (ct: [number[], ITagConfiguration]): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        let coordinate: number[] = ct[0];
                        let configuration: ITagConfiguration = ct[1];

                        if (configuration.createType === "rect") {
                            let geometry: RectGeometry = new RectGeometry([
                                coordinate[0],
                                coordinate[1],
                                coordinate[0],
                                coordinate[1],
                            ]);

                            return new OutlineCreateTag(geometry, { color: configuration.createColor });
                        } else if (configuration.createType === "polygon") {
                            let geometry: PolygonGeometry = new PolygonGeometry([
                                [coordinate[0], coordinate[1]],
                                [coordinate[0], coordinate[1]],
                                [coordinate[0], coordinate[1]],
                            ]);

                            return new OutlineCreateTag(geometry, { color: configuration.createColor });
                        }

                        return null;
                    };
                })
            .subscribe(this._tagOperation$);

        this._delete$
            .map<ICreateTagOperation>(
                (): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        return null;
                    };
                })
            .subscribe(this._tagOperation$);
    }

    public get create$(): Subject<number[]> {
        return this._create$;
    }

    public get delete$(): Subject<void> {
        return this._delete$;
    }

    public get configuration$(): Subject<ITagConfiguration> {
        return this._configuration$;
    }

    public get tag$(): Observable<OutlineCreateTag> {
        return this._tag$;
    }
}

export default TagCreator;
