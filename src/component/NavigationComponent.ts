import {of as observableOf, combineLatest as observableCombineLatest, Observable, Subscription} from "rxjs";

import {switchMap, map} from "rxjs/operators";
import * as vd from "virtual-dom";

import {EdgeDirection, IEdge} from "../Edge";
import {AbortMapillaryError} from "../Error";
import {IEdgeStatus, Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {ComponentService, Component, IComponentConfiguration, INavigationConfiguration} from "../Component";

import {IVNodeHash} from "../Render";

/**
 * @class NavigationComponent
 *
 * @classdesc Fallback navigation component for environments without WebGL support.
 *
 * Replaces the functionality in the Direction and Sequence components.
 */
export class NavigationComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "navigation";

    private _renderSubscription: Subscription;

    private _seqNames: { [dir: string]: string };
    private _spaTopNames: { [dir: string]: string };
    private _spaBottomNames: { [dir: string]: string };

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._seqNames = {};
        this._seqNames[EdgeDirection[EdgeDirection.Prev]] = "Prev";
        this._seqNames[EdgeDirection[EdgeDirection.Next]] = "Next";

        this._spaTopNames = {};
        this._spaTopNames[EdgeDirection[EdgeDirection.TurnLeft]] = "Turnleft";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepLeft]] = "Left";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepForward]] = "Forward";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepRight]] = "Right";
        this._spaTopNames[EdgeDirection[EdgeDirection.TurnRight]] = "Turnright";

        this._spaBottomNames = {};
        this._spaBottomNames[EdgeDirection[EdgeDirection.TurnU]] = "Turnaround";
        this._spaBottomNames[EdgeDirection[EdgeDirection.StepBackward]] = "Backward";
    }

    protected _activate(): void {
        this._renderSubscription = observableCombineLatest(
                this._navigator.stateService.currentNode$,
                this._configuration$).pipe(
            switchMap(
                ([node, configuration]: [Node, INavigationConfiguration]): Observable<EdgeDirection[]> => {
                    const sequenceEdges$: Observable<EdgeDirection[]> = configuration.sequence ?
                        node.sequenceEdges$.pipe(
                            map(
                                (status: IEdgeStatus): EdgeDirection[] => {
                                    return status.edges
                                        .map(
                                            (edge: IEdge): EdgeDirection => {
                                                return edge.data.direction;
                                            });
                                })) :
                        observableOf<EdgeDirection[]>([]);

                    const spatialEdges$: Observable<EdgeDirection[]> = !node.pano && configuration.spatial ?
                        node.spatialEdges$.pipe(
                            map(
                                (status: IEdgeStatus): EdgeDirection[] => {
                                    return status.edges
                                        .map(
                                            (edge: IEdge): EdgeDirection => {
                                                return edge.data.direction;
                                            });
                                })) :
                        observableOf<EdgeDirection[]>([]);

                    return observableCombineLatest(
                            sequenceEdges$,
                            spatialEdges$).pipe(
                        map(
                            ([seq, spa]: [EdgeDirection[], EdgeDirection[]]): EdgeDirection[] => {
                                 return seq.concat(spa);
                            }));
                }),
            map(
                (edgeDirections: EdgeDirection[]): IVNodeHash => {
                    const seqs: vd.VNode[] = this._createArrowRow(this._seqNames, edgeDirections);
                    const spaTops: vd.VNode[] = this._createArrowRow(this._spaTopNames, edgeDirections);
                    const spaBottoms: vd.VNode[] = this._createArrowRow(this._spaBottomNames, edgeDirections);

                    const seqContainer: vd.VNode = vd.h(`div.NavigationSequence`, seqs);
                    const spaTopContainer: vd.VNode = vd.h(`div.NavigationSpatialTop`, spaTops);
                    const spaBottomContainer: vd.VNode = vd.h(`div.NavigationSpatialBottom`, spaBottoms);
                    const spaContainer: vd.VNode = vd.h(`div.NavigationSpatial`, [spaTopContainer, spaBottomContainer]);

                    return { name: this._name, vnode: vd.h(`div.NavigationContainer`, [seqContainer, spaContainer]) };
                }))
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): INavigationConfiguration {
        return { sequence: true, spatial: true };
    }

    private _createArrowRow(arrowNames: { [dir: string]: string }, edgeDirections: EdgeDirection[]): vd.VNode[] {
        const arrows: vd.VNode[] = [];

        for (const arrowName in arrowNames) {
            if (!(arrowNames.hasOwnProperty(arrowName))) {
                continue;
            }

            const direction: EdgeDirection = EdgeDirection[<keyof typeof EdgeDirection>arrowName];
            if (edgeDirections.indexOf(direction) !== -1) {
                arrows.push(this._createVNode(direction, arrowNames[arrowName], "visible"));
            } else {
                arrows.push(this._createVNode(direction, arrowNames[arrowName], "hidden"));
            }
        }

        return arrows;
    }

    private _createVNode(direction: EdgeDirection, name: string, visibility: string): vd.VNode {
        return vd.h(
            `span.Direction.Direction${name}`,
            {
                onclick: (ev: Event): void => {
                    this._navigator.moveDir$(direction)
                        .subscribe(
                            undefined,
                            (error: Error): void => {
                                if (!(error instanceof AbortMapillaryError)) {
                                    console.error(error);
                                }
                            });
                },
                style: {
                    visibility: visibility,
                },
            },
            []);
    }
}

ComponentService.register(NavigationComponent);
export default NavigationComponent;
