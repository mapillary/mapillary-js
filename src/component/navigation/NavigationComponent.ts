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

import { Component } from "../Component";
import { NavigationConfiguration } from "../interfaces/NavigationConfiguration";

import { AbortMapillaryError } from "../../error/AbortMapillaryError";
import { Node } from "../../graph/Node";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { NavigationEdge } from "../../graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "../../graph/interfaces/NavigationEdgeStatus";
import { VirtualNodeHash } from "../../render/interfaces/VirtualNodeHash";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { isSpherical } from "../../geo/Geo";

/**
 * @class NavigationComponent
 *
 * @classdesc Fallback navigation component for environments without WebGL support.
 *
 * Replaces the functionality in the Direction and Sequence components.
 */
export class NavigationComponent extends Component<NavigationConfiguration> {
    public static componentName: string = "navigation";

    private _seqNames: { [dir: string]: string };
    private _spaTopNames: { [dir: string]: string };
    private _spaBottomNames: { [dir: string]: string };

    /** @ignore */
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._seqNames = {};
        this._seqNames[NavigationDirection[NavigationDirection.Prev]] = "-prev";
        this._seqNames[NavigationDirection[NavigationDirection.Next]] = "-next";

        this._spaTopNames = {};
        this._spaTopNames[NavigationDirection[NavigationDirection.TurnLeft]] = "-turn-left";
        this._spaTopNames[NavigationDirection[NavigationDirection.StepLeft]] = "-left";
        this._spaTopNames[NavigationDirection[NavigationDirection.StepForward]] = "-forward";
        this._spaTopNames[NavigationDirection[NavigationDirection.StepRight]] = "-right";
        this._spaTopNames[NavigationDirection[NavigationDirection.TurnRight]] = "-turn-right";
        this._spaBottomNames = {};
        this._spaBottomNames[NavigationDirection[NavigationDirection.TurnU]] = "-turn-around";
        this._spaBottomNames[NavigationDirection[NavigationDirection.StepBackward]] = "-backward";
    }

    protected _activate(): void {
        this._subscriptions.push(observableCombineLatest(
            this._navigator.stateService.currentNode$,
            this._configuration$).pipe(
                switchMap(
                    ([node, configuration]: [Node, NavigationConfiguration]): Observable<NavigationDirection[]> => {
                        const sequenceEdges$: Observable<NavigationDirection[]> = configuration.sequence ?
                            node.sequenceEdges$.pipe(
                                map(
                                    (status: NavigationEdgeStatus): NavigationDirection[] => {
                                        return status.edges
                                            .map(
                                                (edge: NavigationEdge): NavigationDirection => {
                                                    return edge.data.direction;
                                                });
                                    })) :
                            observableOf<NavigationDirection[]>([]);

                        const spatialEdges$: Observable<NavigationDirection[]> = !isSpherical(node.cameraType) &&
                            configuration.spatial ?
                            node.spatialEdges$.pipe(
                                map(
                                    (status: NavigationEdgeStatus): NavigationDirection[] => {
                                        return status.edges
                                            .map(
                                                (edge: NavigationEdge): NavigationDirection => {
                                                    return edge.data.direction;
                                                });
                                    })) :
                            observableOf<NavigationDirection[]>([]);

                        return observableCombineLatest(
                            sequenceEdges$,
                            spatialEdges$).pipe(
                                map(
                                    ([seq, spa]: [NavigationDirection[], NavigationDirection[]]): NavigationDirection[] => {
                                        return seq.concat(spa);
                                    }));
                    }),
                map(
                    (edgeDirections: NavigationDirection[]): VirtualNodeHash => {
                        const seqs: vd.VNode[] = this._createArrowRow(this._seqNames, edgeDirections);
                        const spaTops: vd.VNode[] = this._createArrowRow(this._spaTopNames, edgeDirections);
                        const spaBottoms: vd.VNode[] = this._createArrowRow(this._spaBottomNames, edgeDirections);

                        const seqContainer: vd.VNode = vd.h(`div.mapillary-navigation-sequence`, seqs);
                        const spaTopContainer: vd.VNode = vd.h(`div.NavigationSpatialTop`, spaTops);
                        const spaBottomContainer: vd.VNode = vd.h(`div.mapillary-navigation-spatial-bottom`, spaBottoms);
                        const spaContainer: vd.VNode = vd.h(`div.mapillary-navigation-spatial`, [spaTopContainer, spaBottomContainer]);

                        return { name: this._name, vnode: vd.h(`div.NavigationContainer`, [seqContainer, spaContainer]) };
                    }))
            .subscribe(this._container.domRenderer.render$));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
    }

    protected _getDefaultConfiguration(): NavigationConfiguration {
        return { sequence: true, spatial: true };
    }

    private _createArrowRow(arrowNames: { [dir: string]: string }, edgeDirections: NavigationDirection[]): vd.VNode[] {
        const arrows: vd.VNode[] = [];

        for (const arrowName in arrowNames) {
            if (!(arrowNames.hasOwnProperty(arrowName))) {
                continue;
            }

            const direction: NavigationDirection = NavigationDirection[<keyof typeof NavigationDirection>arrowName];
            if (edgeDirections.indexOf(direction) !== -1) {
                arrows.push(this._createVNode(direction, arrowNames[arrowName], "visible"));
            } else {
                arrows.push(this._createVNode(direction, arrowNames[arrowName], "hidden"));
            }
        }

        return arrows;
    }

    private _createVNode(direction: NavigationDirection, name: string, visibility: string): vd.VNode {
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