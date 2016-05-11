/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {
    CreateLineTag,
    GeometryType,
    RectGeometry,
} from "../../Component";

interface ICreateTagOperation {
    (tag: CreateLineTag): CreateLineTag;
}

export class TagCreator {
    private _tagOperation$: rx.Subject<ICreateTagOperation>;
    private _tag$: rx.Observable<CreateLineTag>;

    private _create$: rx.Subject<number[]>;
    private _delete$: rx.Subject<void>;

    private _geometryType$: rx.Subject<GeometryType>;

    constructor() {
        this._tagOperation$ = new rx.Subject<ICreateTagOperation>();
        this._create$ = new rx.Subject<number[]>();
        this._delete$ = new rx.Subject<void>();

        this._geometryType$ = new rx.Subject<GeometryType>();

        this._tag$ = this._tagOperation$
            .scan<CreateLineTag>(
                (tag: CreateLineTag, operation: ICreateTagOperation): CreateLineTag => {
                    return operation(tag);
                },
                null)
            .share();

        this._create$
            .withLatestFrom(
                this._geometryType$,
                (coordinate: number[], type: GeometryType): [number[], GeometryType] => {
                    return [coordinate, type];
                })
            .map<ICreateTagOperation>(
                (ct: [number[], GeometryType]): ICreateTagOperation => {
                    return (tag: CreateLineTag): CreateLineTag => {
                        let coordinate: number[] = ct[0];
                        let type: GeometryType = ct[1];

                        if (type === "rect") {
                            let geometry: RectGeometry = new RectGeometry([
                                coordinate[0],
                                coordinate[1],
                                coordinate[0],
                                coordinate[1],
                            ]);

                            return new CreateLineTag(geometry);
                        }

                        return null;
                    };
                })
            .subscribe(this._tagOperation$);

        this._delete$
            .map<ICreateTagOperation>(
                (): ICreateTagOperation => {
                    return (tag: CreateLineTag): CreateLineTag => {
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

    public get geometryType$(): rx.Subject<GeometryType> {
        return this._geometryType$;
    }

    public get tag$(): rx.Observable<CreateLineTag> {
        return this._tag$;
    }
}

export default TagCreator;
