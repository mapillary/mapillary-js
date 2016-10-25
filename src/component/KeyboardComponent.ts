import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import "rxjs/add/observable/fromEvent";

import "rxjs/add/operator/withLatestFrom";

import {EdgeDirection, IEdge} from "../Edge";
import {ComponentService, Component, IComponentConfiguration} from "../Component";
import {Container, Navigator} from "../Viewer";
import {IFrame, IRotation} from "../State";
import {IEdgeStatus, Node} from "../Graph";
import {Spatial, Camera} from "../Geo";

interface IKeyboardFrame {
    event: KeyboardEvent;
    frame: IFrame;
    sequenceEdges: IEdgeStatus;
    spatialEdges: IEdgeStatus;
}

export class KeyboardComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "keyboard";

    private _spatial: Spatial;

    private _disposable: Subscription;
    private _perspectiveDirections: EdgeDirection[];

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();

        this._perspectiveDirections = [
            EdgeDirection.StepForward,
            EdgeDirection.StepBackward,
            EdgeDirection.StepLeft,
            EdgeDirection.StepRight,
            EdgeDirection.TurnLeft,
            EdgeDirection.TurnRight,
            EdgeDirection.TurnU,
        ];
    }

    protected _activate(): void {
        let sequenceEdges$: Observable<IEdgeStatus> = this._navigator.stateService.currentNode$
            .switchMap<IEdgeStatus>(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.sequenceEdges$;
                });

        let spatialEdges$: Observable<IEdgeStatus> = this._navigator.stateService.currentNode$
            .switchMap<IEdgeStatus>(
                (node: Node): Observable<IEdgeStatus> => {
                    return node.spatialEdges$;
                });

        this._disposable = Observable
            .fromEvent(document, "keydown")
            .withLatestFrom(
                this._navigator.stateService.currentState$,
                sequenceEdges$,
                spatialEdges$,
                (event: KeyboardEvent, frame: IFrame, sequenceEdges: IEdgeStatus, spatialEdges: IEdgeStatus): IKeyboardFrame => {
                    return { event: event, frame: frame, sequenceEdges: sequenceEdges, spatialEdges: spatialEdges };
                })
            .subscribe((kf: IKeyboardFrame): void => {
                if (!kf.frame.state.currentNode.pano) {
                    this._navigatePerspective(kf.event, kf.sequenceEdges, kf.spatialEdges);
                } else {
                    this._navigatePanorama(kf.event, kf.sequenceEdges, kf.spatialEdges, kf.frame.state.camera);
                }
            });
    }

    protected _deactivate(): void {
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _navigatePanorama(event: KeyboardEvent, sequenceEdges: IEdgeStatus, spatialEdges: IEdgeStatus, camera: Camera): void {
        let navigationAngle: number = 0;
        let stepDirection: EdgeDirection = null;
        let sequenceDirection: EdgeDirection = null;

        let phi: number = this._rotationFromCamera(camera).phi;

        switch (event.keyCode) {
            case 37: // left
                if (event.shiftKey || event.altKey) {
                    break;
                }

                navigationAngle = Math.PI / 2 + phi;
                stepDirection = EdgeDirection.StepLeft;
                break;
            case 38: // up
                if (event.shiftKey) {
                    break;
                }

                if (event.altKey) {
                    sequenceDirection = EdgeDirection.Next;
                    break;
                }

                navigationAngle = phi;
                stepDirection = EdgeDirection.StepForward;
                break;
            case 39: // right
                if (event.shiftKey || event.altKey) {
                    break;
                }

                navigationAngle = -Math.PI / 2 + phi;
                stepDirection = EdgeDirection.StepRight;
                break;
            case 40: // down
                if (event.shiftKey) {
                    break;
                }

                if (event.altKey) {
                    sequenceDirection = EdgeDirection.Prev;
                    break;
                }

                navigationAngle = Math.PI + phi;
                stepDirection = EdgeDirection.StepBackward;
                break;
            default:
                return;
        }

        event.preventDefault();

        if (sequenceDirection != null) {
            this._moveInDir(sequenceDirection, sequenceEdges);
            return;
        }

        if (stepDirection == null || !spatialEdges.cached) {
            return;
        }

        navigationAngle = this._spatial.wrapAngle(navigationAngle);

        let threshold: number = Math.PI / 4;

        let edges: IEdge[] = spatialEdges.edges.filter(
            (e: IEdge): boolean => {
                return e.data.direction === EdgeDirection.Pano ||
                    e.data.direction === stepDirection;
            });

        let smallestAngle: number = Number.MAX_VALUE;
        let toKey: string = null;

        for (let edge of edges) {
            let angle: number = Math.abs(this._spatial.wrapAngle(edge.data.worldMotionAzimuth - navigationAngle));

            if (angle < Math.min(smallestAngle, threshold)) {
                smallestAngle = angle;
                toKey = edge.to;
            }
        }

        if (toKey == null) {
            return;
        }

        this._navigator.moveToKey$(toKey)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { console.error(e); });
    }

    private _rotationFromCamera(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        let upProjection: number = direction.clone().dot(camera.up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(camera.up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private _navigatePerspective(event: KeyboardEvent, sequenceEdges: IEdgeStatus, spatialEdges: IEdgeStatus): void {
        let direction: EdgeDirection = null;
        let sequenceDirection: EdgeDirection = null;

        switch (event.keyCode) {
            case 37: // left
                if (event.altKey) {
                    break;
                }

                direction = event.shiftKey ? EdgeDirection.TurnLeft : EdgeDirection.StepLeft;
                break;
            case 38: // up
                if (event.altKey) {
                    sequenceDirection = EdgeDirection.Next;
                    break;
                }

                direction = event.shiftKey ? EdgeDirection.Pano : EdgeDirection.StepForward;
                break;
            case 39: // right
                if (event.altKey) {
                    break;
                }

                direction = event.shiftKey ? EdgeDirection.TurnRight : EdgeDirection.StepRight;
                break;
            case 40: // down
                if (event.altKey) {
                    sequenceDirection = EdgeDirection.Prev;
                    break;
                }

                direction = event.shiftKey ? EdgeDirection.TurnU : EdgeDirection.StepBackward;
                break;
            default:
                return;
        }

        event.preventDefault();

        if (sequenceDirection != null) {
            this._moveInDir(sequenceDirection, sequenceEdges);
            return;
        }

        this._moveInDir(direction, spatialEdges);
    }

    private _moveInDir(direction: EdgeDirection, edgeStatus: IEdgeStatus): void {
        if (!edgeStatus.cached) {
            return;
        }

        for (let edge of edgeStatus.edges) {
            if (edge.data.direction === direction) {
                this._navigator.moveToKey$(edge.to)
                    .subscribe(
                        (n: Node): void => { return; },
                        (e: Error): void => { console.error(e); });

                return;
            }
        }
    }
}

ComponentService.register(KeyboardComponent);
export default KeyboardComponent;
