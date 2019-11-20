import {scan, share, withLatestFrom, map, publishReplay, refCount} from "rxjs/operators";
import {Observable, Subject} from "rxjs";

import {
    Component,
    ITagConfiguration,
    PolygonGeometry,
    RectGeometry,
    PointsGeometry,
    ExtremePointCreateTag,
    OutlineCreateTag,
} from "../../Component";
import {Transform} from "../../Geo";
import {Navigator} from "../../Viewer";
import CreateTag from "./tag/CreateTag";
import Geometry from "./geometry/Geometry";

interface ICreateTagOperation {
    (tag: CreateTag<Geometry>): CreateTag<Geometry>;
}

export class TagCreator {
    private _component: Component<ITagConfiguration>;
    private _navigator: Navigator;

    private _tagOperation$: Subject<ICreateTagOperation>;
    private _tag$: Observable<CreateTag<Geometry>>;
    private _replayedTag$: Observable<CreateTag<Geometry>>;

    private _createPoints$: Subject<number[]>;
    private _createPolygon$: Subject<number[]>;
    private _createRect$: Subject<number[]>;
    private _delete$: Subject<void>;

    constructor(component: Component<ITagConfiguration>, navigator: Navigator) {
        this._component = component;
        this._navigator = navigator;

        this._tagOperation$ = new Subject<ICreateTagOperation>();
        this._createPoints$ = new Subject<number[]>();
        this._createPolygon$ = new Subject<number[]>();
        this._createRect$ = new Subject<number[]>();
        this._delete$ = new Subject<void>();

        this._tag$ = this._tagOperation$.pipe(
            scan(
                (tag: CreateTag<Geometry>, operation: ICreateTagOperation): CreateTag<Geometry> => {
                    return operation(tag);
                },
                null),
            share());

        this._replayedTag$ = this._tag$.pipe(
            publishReplay(1),
            refCount());

        this._replayedTag$.subscribe();

        this._createPoints$.pipe(
            withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$),
            map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): ICreateTagOperation => {
                    return (): CreateTag<Geometry> => {
                        const geometry: PointsGeometry = new PointsGeometry([
                            [coord[0], coord[1]],
                            [coord[0], coord[1]],
                        ]);

                        return new ExtremePointCreateTag(
                            geometry,
                            {
                                color: conf.createColor,
                                indicateCompleter: conf.indicatePointsCompleter,
                            },
                            transform);
                    };
                }))
            .subscribe(this._tagOperation$);

        this._createRect$.pipe(
            withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$),
            map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): ICreateTagOperation => {
                    return (): CreateTag<Geometry> => {
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
                    return (): CreateTag<Geometry> => {
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
                    return (): CreateTag<Geometry> => {
                        return null;
                    };
                }))
            .subscribe(this._tagOperation$);
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

    public get tag$(): Observable<CreateTag<Geometry>> {
        return this._tag$;
    }

    public get replayedTag$(): Observable<CreateTag<Geometry>> {
        return this._replayedTag$;
    }
}

export default TagCreator;
