import {
    map,
    publishReplay,
    refCount,
    scan,
    share,
    withLatestFrom,
} from "rxjs/operators";

import {
    Observable,
    Subject,
} from "rxjs";
import { CreateTag } from "./tag/CreateTag";
import { Geometry } from "./geometry/Geometry";
import { Component } from "../Component";
import { TagConfiguration } from "../interfaces/TagConfiguration";

import { Navigator } from "../../viewer/Navigator";
import { Transform } from "../../geo/Transform";
import { PointsGeometry } from "./geometry/PointsGeometry";
import { ExtremePointCreateTag } from "./tag/ExtremePointCreateTag";
import { RectGeometry } from "./geometry/RectGeometry";
import { OutlineCreateTag } from "./tag/OutlineCreateTag";
import { PolygonGeometry } from "./geometry/PolygonGeometry";

interface CreateTagOperation {
    (tag: CreateTag<Geometry>): CreateTag<Geometry>;
}

export class TagCreator {
    private _component: Component<TagConfiguration>;
    private _navigator: Navigator;

    private _tagOperation$: Subject<CreateTagOperation>;
    private _tag$: Observable<CreateTag<Geometry>>;
    private _replayedTag$: Observable<CreateTag<Geometry>>;

    private _createPoints$: Subject<number[]>;
    private _createPolygon$: Subject<number[]>;
    private _createRect$: Subject<number[]>;
    private _delete$: Subject<void>;

    constructor(component: Component<TagConfiguration>, navigator: Navigator) {
        this._component = component;
        this._navigator = navigator;

        this._tagOperation$ = new Subject<CreateTagOperation>();
        this._createPoints$ = new Subject<number[]>();
        this._createPolygon$ = new Subject<number[]>();
        this._createRect$ = new Subject<number[]>();
        this._delete$ = new Subject<void>();

        this._tag$ = this._tagOperation$.pipe(
            scan(
                (tag: CreateTag<Geometry>, operation: CreateTagOperation): CreateTag<Geometry> => {
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
                ([coord, conf, transform]: [number[], TagConfiguration, Transform]): CreateTagOperation => {
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
                ([coord, conf, transform]: [number[], TagConfiguration, Transform]): CreateTagOperation => {
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
                ([coord, conf, transform]: [number[], TagConfiguration, Transform]): CreateTagOperation => {
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
                (): CreateTagOperation => {
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
