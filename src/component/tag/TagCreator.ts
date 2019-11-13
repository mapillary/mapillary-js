import {scan, share, withLatestFrom, map} from "rxjs/operators";
import {Observable, Subject} from "rxjs";

import {
    Component,
    ITagConfiguration,
    OutlineCreateTag,
    PolygonGeometry,
    RectGeometry,
} from "../../Component";
import {Transform} from "../../Geo";
import {Navigator} from "../../Viewer";
import { ExtremePointCreateTag } from "./tag/ExtremePointCreateTag";
import PointsGeometry from "./geometry/PointsGeometry";

interface ICreateTagOperation {
    (tag: OutlineCreateTag): OutlineCreateTag;
}

interface IExtremeCreateTagOperation {
    (tag: ExtremePointCreateTag): ExtremePointCreateTag;
}

export class TagCreator {
    private _component: Component<ITagConfiguration>;
    private _navigator: Navigator;

    private _extremeTagOperation$: Subject<IExtremeCreateTagOperation>;
    private _extremeTag$: Observable<ExtremePointCreateTag>;
    private _tagOperation$: Subject<ICreateTagOperation>;
    private _tag$: Observable<OutlineCreateTag>;

    private _createPoints$: Subject<number[]>;
    private _createPolygon$: Subject<number[]>;
    private _createRect$: Subject<number[]>;
    private _deleteExtreme$: Subject<void>;
    private _delete$: Subject<void>;

    constructor(component: Component<ITagConfiguration>, navigator: Navigator) {
        this._component = component;
        this._navigator = navigator;

        this._tagOperation$ = new Subject<ICreateTagOperation>();
        this._extremeTagOperation$ = new Subject<IExtremeCreateTagOperation>();
        this._createPoints$ = new Subject<number[]>();
        this._createPolygon$ = new Subject<number[]>();
        this._createRect$ = new Subject<number[]>();
        this._deleteExtreme$ = new Subject<void>();
        this._delete$ = new Subject<void>();

        this._tag$ = this._tagOperation$.pipe(
            scan(
                (tag: OutlineCreateTag, operation: ICreateTagOperation): OutlineCreateTag => {
                    return operation(tag);
                },
                null),
            share());

        this._extremeTag$ = this._extremeTagOperation$.pipe(
            scan(
                (tag: ExtremePointCreateTag, operation: IExtremeCreateTagOperation): ExtremePointCreateTag => {
                    return operation(tag);
                },
                null),
            share());

        this._createPoints$.pipe(
            withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$),
            map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): IExtremeCreateTagOperation => {
                    return (tag: ExtremePointCreateTag): ExtremePointCreateTag => {
                        const geometry: PointsGeometry = new PointsGeometry([
                            [coord[0], coord[1]],
                            [coord[0], coord[1]],
                        ]);

                        return new ExtremePointCreateTag(geometry, { color: conf.createColor }, transform);
                    };
                }))
            .subscribe(this._extremeTagOperation$);

        this._createRect$.pipe(
            withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$),
            map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        const geometry: RectGeometry = new RectGeometry([
                            coord[0],
                            coord[1],
                            coord[0],
                            coord[1],
                        ]);

                        return new OutlineCreateTag(geometry, { color: conf.createColor }, transform);
                    };
                }))
            .subscribe(this._tagOperation$);

        this._createPolygon$.pipe(
            withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$),
            map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        const geometry: PolygonGeometry = new PolygonGeometry([
                            [coord[0], coord[1]],
                            [coord[0], coord[1]],
                            [coord[0], coord[1]],
                        ]);

                        return new OutlineCreateTag(geometry, { color: conf.createColor }, transform);
                    };
                }))
            .subscribe(this._tagOperation$);

        this._delete$.pipe(
            map(
                (): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        return null;
                    };
                }))
            .subscribe(this._tagOperation$);

        this._deleteExtreme$.pipe(
            map(
                (): IExtremeCreateTagOperation => {
                    return (tag: ExtremePointCreateTag): ExtremePointCreateTag => {
                        return null;
                    };
                }))
            .subscribe(this._extremeTagOperation$);
    }

    public get createRect$(): Subject<number[]> {
        return this._createRect$;
    }

    public get createPolygon$(): Subject<number[]> {
        return this._createPolygon$;
    }

    public get createPoints$(): Subject<number[]> {
        return this._createPoints$;
    }

    public get delete$(): Subject<void> {
        return this._delete$;
    }

    public get deleteExtreme$(): Subject<void> {
        return this._deleteExtreme$;
    }

    public get tag$(): Observable<OutlineCreateTag> {
        return this._tag$;
    }

    public get extremeTag$(): Observable<ExtremePointCreateTag> {
        return this._extremeTag$;
    }
}

export default TagCreator;
