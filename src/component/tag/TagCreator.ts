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

interface ICreateTagOperation {
    (tag: OutlineCreateTag): OutlineCreateTag;
}

export class TagCreator {
    private _component: Component<ITagConfiguration>;
    private _navigator: Navigator;

    private _tagOperation$: Subject<ICreateTagOperation>;
    private _tag$: Observable<OutlineCreateTag>;

    private _createPolygon$: Subject<number[]>;
    private _createRect$: Subject<number[]>;
    private _delete$: Subject<void>;

    constructor(component: Component<ITagConfiguration>, navigator: Navigator) {
        this._component = component;
        this._navigator = navigator;

        this._tagOperation$ = new Subject<ICreateTagOperation>();
        this._createPolygon$ = new Subject<number[]>();
        this._createRect$ = new Subject<number[]>();
        this._delete$ = new Subject<void>();

        this._tag$ = this._tagOperation$.pipe(
            scan(
                (tag: OutlineCreateTag, operation: ICreateTagOperation): OutlineCreateTag => {
                    return operation(tag);
                },
                null),
            share());

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
    }

    public get createRect$(): Subject<number[]> {
        return this._createRect$;
    }

    public get createPolygon$(): Subject<number[]> {
        return this._createPolygon$;
    }

    public get delete$(): Subject<void> {
        return this._delete$;
    }

    public get tag$(): Observable<OutlineCreateTag> {
        return this._tag$;
    }
}

export default TagCreator;
