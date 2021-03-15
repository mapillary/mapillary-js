import * as vd from "virtual-dom";

import {
    combineLatest as observableCombineLatest,
    of as observableOf,
    Observable,
    Subscription,
} from "rxjs";

import {
    map,
    switchMap,
} from "rxjs/operators";

import { Component } from "./Component";
import { INavigationConfiguration } from "./interfaces/INavigationConfiguration";

import { AbortMapillaryError } from "../error/AbortMapillaryError";
import { Node } from "../graph/Node";
import { EdgeDirection } from "../graph/edge/EdgeDirection";
import { IEdge } from "../graph/edge/interfaces/IEdge";
import { IEdgeStatus } from "../graph/interfaces/IEdgeStatus";
import { IVNodeHash } from "../render/interfaces/IVNodeHash";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

/**
 * @class NavigationComponent
 *
 * @classdesc Fallback navigation component for environments without WebGL support.
 *
 * Replaces the functionality in the Direction and Sequence components.
 */
export class NavigationComponent extends Component<INavigationConfiguration> {
    public static componentName: string = "navigation";

    private _renderSubscription: Subscription;

    private _seqNames: { [dir: string]: string };
    private _spaTopNames: { [dir: string]: string };
    private _spaBottomNames: { [dir: string]: string };

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._seqNames = {};
        this._seqNames[EdgeDirection[EdgeDirection.Prev]] = "-prev";
        this._seqNames[EdgeDirection[EdgeDirection.Next]] = "-next";

        this._spaTopNames = {};
        this._spaTopNames[EdgeDirection[EdgeDirection.TurnLeft]] = "-turn-left";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepLeft]] = "-left";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepForward]] = "-forward";
        this._spaTopNames[EdgeDirection[EdgeDirection.StepRight]] = "-right";
        this._spaTopNames[EdgeDirection[EdgeDirection.TurnRight]] = "-turn-right";
        this._spaBottomNames = {};
        this._spaBottomNames[EdgeDirection[EdgeDirection.TurnU]] = "-turn-around";
        this._spaBottomNames[EdgeDirection[EdgeDirection.StepBackward]] = "-backward";
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

                        const seqContainer: vd.VNode = vd.h(`div.mapillary-navigation-sequence`, seqs);
                        const spaTopContainer: vd.VNode = vd.h(`div.NavigationSpatialTop`, spaTops);
                        const spaBottomContainer: vd.VNode = vd.h(`div.mapillary-navigation-spatial-bottom`, spaBottoms);
                        const spaContainer: vd.VNode = vd.h(`div.mapillary-navigation-spatial`, [spaTopContainer, spaBottomContainer]);

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
            `span.mapillary-navigation-button.mapillary-navigation${name}`,
            {
                onclick: (): void => {
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
