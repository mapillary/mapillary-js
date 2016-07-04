/// <reference path="../../../typings/index.d.ts" />

import * as rx from "rx";

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
    private _tagOperation$: rx.Subject<ICreateTagOperation>;
    private _tag$: rx.Observable<OutlineCreateTag>;

    private _create$: rx.Subject<number[]>;
    private _delete$: rx.Subject<void>;

    private _configuration$: rx.Subject<ITagConfiguration>;

    constructor() {
        this._tagOperation$ = new rx.Subject<ICreateTagOperation>();
        this._create$ = new rx.Subject<number[]>();
        this._delete$ = new rx.Subject<void>();

        this._configuration$ = new rx.Subject<ITagConfiguration>();

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

    public get create$(): rx.Subject<number[]> {
        return this._create$;
    }

    public get delete$(): rx.Subject<void> {
        return this._delete$;
    }

    public get configuration$(): rx.Subject<ITagConfiguration> {
        return this._configuration$;
    }

    public get tag$(): rx.Observable<OutlineCreateTag> {
        return this._tag$;
    }
}

export default TagCreator;
