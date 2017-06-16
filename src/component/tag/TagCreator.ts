import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/share";
import "rxjs/add/operator/withLatestFrom";

import {
    Component,
    ITagConfiguration,
    OutlineCreateTag,
    PolygonGeometry,
    RectGeometry,
    TagMode,
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

    private _create$: Subject<number[]>;
    private _delete$: Subject<void>;

    constructor(component: Component<ITagConfiguration>, navigator: Navigator) {
        this._component = component;
        this._navigator = navigator;

        this._tagOperation$ = new Subject<ICreateTagOperation>();
        this._create$ = new Subject<number[]>();
        this._delete$ = new Subject<void>();

        this._tag$ = this._tagOperation$
            .scan(
                (tag: OutlineCreateTag, operation: ICreateTagOperation): OutlineCreateTag => {
                    return operation(tag);
                },
                null)
            .share();

        this._create$
            .withLatestFrom(
                this._component.configuration$,
                this._navigator.stateService.currentTransform$)
            .map(
                ([coord, conf, transform]: [number[], ITagConfiguration, Transform]): ICreateTagOperation => {
                    return (tag: OutlineCreateTag): OutlineCreateTag => {
                        if (conf.mode === TagMode.Rect) {
                            let geometry: RectGeometry = new RectGeometry([
                                coord[0],
                                coord[1],
                                coord[0],
                                coord[1],
                            ]);

                            return new OutlineCreateTag(geometry, { color: conf.createColor }, transform);
                        } else if (conf.mode === TagMode.Polygon) {
                            let geometry: PolygonGeometry = new PolygonGeometry([
                                [coord[0], coord[1]],
                                [coord[0], coord[1]],
                                [coord[0], coord[1]],
                            ]);

                            return new OutlineCreateTag(geometry, { color: conf.createColor }, transform);
                        }

                        return null;
                    };
                })
            .subscribe(this._tagOperation$);

        this._delete$
            .map(
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

    public get tag$(): Observable<OutlineCreateTag> {
        return this._tag$;
    }
}

export default TagCreator;
