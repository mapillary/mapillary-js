import {
    combineLatest as observableCombineLatest,
    of as observableOf,
    from as observableFrom,
    Observable,
    Subscription,
} from "rxjs";

import {
    map,
    filter,
    distinctUntilChanged,
    mergeMap,
    distinct,
    scan,
    pluck,
} from "rxjs/operators";

import * as vd from "virtual-dom";

import {ISequence} from "../API";
import {IRouteConfiguration, IRoutePath, ComponentService, Component} from "../Component";
import {Node} from "../Graph";
import {IVNodeHash} from "../Render";
import {IFrame} from "../State";
import {Container, Navigator} from "../Viewer";

interface IRtAndFrame {
    routeTrack: RouteTrack;
    frame: IFrame;
    conf: IRouteConfiguration;
}

interface IConfAndNode {
    conf: IRouteConfiguration;
    node: Node;
}

interface INodeInstruction {
    key: string;
    description: string;
}

interface IInstructionPlace {
    place: number;
    nodeInstructions: INodeInstruction[];
}

class DescriptionState {
    public description: string;
    public showsLeft: number;
}

class RouteState {
    public routeTrack: RouteTrack;
    public currentNode: Node;
    public lastNode: Node;
    public playing: boolean;
}

class RouteTrack {
    public nodeInstructions: INodeInstruction[] = [];
    public nodeInstructionsOrdered: INodeInstruction[][] = [];
}

export class RouteComponent extends Component<IRouteConfiguration> {
    public static componentName: string = "route";

    private _disposable: Subscription;
    private _disposableDescription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public play(): void {
        this.configure({ playing: true });
    }

    public stop(): void {
        this.configure({ playing: false });
    }

    protected _activate(): void {
        let slowedStream$: Observable<IFrame> = this._navigator.stateService.currentState$.pipe(
            filter(
                (frame: IFrame) => {
                    return (frame.id % 2) === 0;
                }),
            filter(
                (frame: IFrame) => {
                    return frame.state.nodesAhead < 15;
                }),
            distinctUntilChanged(
                undefined,
                (frame: IFrame): string => {
                    return frame.state.lastNode.key;
                    }));

        let routeTrack$: Observable<RouteTrack> = observableCombineLatest(
                this.configuration$.pipe(
                    mergeMap(
                        (conf: IRouteConfiguration): Observable<IRoutePath> => {
                            return observableFrom(conf.paths);
                        }),
                    distinct(
                        (p: IRoutePath): string => {
                            return p.sequenceKey;
                        }),
                    mergeMap(
                        (path: IRoutePath): Observable<ISequence> => {
                            return this._navigator.api.sequenceByKey$([path.sequenceKey]).pipe(
                                map(
                                    (sequenceByKey: { [sequenceKey: string]: ISequence }): ISequence => {
                                        return sequenceByKey[path.sequenceKey];
                                    }));
                        })),
                this.configuration$).pipe(
            map(
                ([sequence, conf]: [ISequence, IRouteConfiguration]): IInstructionPlace[] => {
                    let i: number = 0;
                    let instructionPlaces: IInstructionPlace[] = [];

                    for (let path of conf.paths) {
                        if (path.sequenceKey === sequence.key) {
                            let nodeInstructions: INodeInstruction[] = [];
                            let saveKey: boolean = false;
                            for (let key of sequence.keys) {
                                if (path.startKey === key) {
                                    saveKey = true;
                                }
                                if (saveKey) {
                                    let description: string = null;

                                    for (let infoKey of path.infoKeys) {
                                        if (infoKey.key === key) {
                                            description = infoKey.description;
                                        }
                                    }

                                    nodeInstructions.push({description: description, key: key});
                                }
                                if (path.stopKey === key) {
                                    saveKey = false;
                                }
                            }
                            instructionPlaces.push({nodeInstructions: nodeInstructions, place: i});
                        }
                        i++;
                    }

                    return instructionPlaces;
                }),
            scan(
                (routeTrack: RouteTrack, instructionPlaces: IInstructionPlace[]): RouteTrack => {
                    for (let instructionPlace of instructionPlaces) {
                        routeTrack.nodeInstructionsOrdered[instructionPlace.place] = instructionPlace.nodeInstructions;
                    }

                    for (const place in routeTrack.nodeInstructionsOrdered) {
                        if (!routeTrack.nodeInstructionsOrdered.hasOwnProperty(place)) {
                            continue;
                        }

                        const instructionGroup: INodeInstruction[] = routeTrack.nodeInstructionsOrdered[place];

                        for (const instruction of instructionGroup) {
                            routeTrack.nodeInstructions.push(instruction);
                        }
                    }

                    return routeTrack;
                },
                new RouteTrack()));

        const cacheNode$: any = observableCombineLatest(
                slowedStream$,
                routeTrack$,
                this.configuration$).pipe(
            map(
                ([frame, routeTrack, conf]: [IFrame, RouteTrack, IRouteConfiguration]): IRtAndFrame => {
                    return {conf: conf, frame: frame, routeTrack: routeTrack};
                }),
            scan(
                (routeState: RouteState, rtAndFrame: IRtAndFrame): RouteState => {
                    if (rtAndFrame.conf.playing === undefined || rtAndFrame.conf.playing) {
                        routeState.routeTrack = rtAndFrame.routeTrack;
                        routeState.currentNode = rtAndFrame.frame.state.currentNode;
                        routeState.lastNode = rtAndFrame.frame.state.lastNode;
                        routeState.playing = true;
                    } else {
                        this._navigator.stateService.cutNodes();
                        routeState.playing = false;
                    }
                    return routeState;
                },
                new RouteState()),
            filter(
                (routeState: RouteState): boolean => {
                    return routeState.playing;
                }),
            filter(
                (routeState: RouteState): boolean => {
                    for (let nodeInstruction of routeState.routeTrack.nodeInstructions) {
                        if (!nodeInstruction) {
                            continue;
                        }
                        if (nodeInstruction.key === routeState.lastNode.key) {
                            return true;
                        }
                    }

                    return false;
                }),
            distinctUntilChanged(
                undefined,
                (routeState: RouteState): string => {
                    return routeState.lastNode.key;
                }),
            mergeMap(
                (routeState: RouteState): Observable<Node> => {
                    let i: number = 0;
                    for (let nodeInstruction of routeState.routeTrack.nodeInstructions) {
                        if (nodeInstruction.key === routeState.lastNode.key) {
                            break;
                        }
                        i++;
                    }

                    let nextInstruction: INodeInstruction = routeState.routeTrack.nodeInstructions[i + 1];
                    if (!nextInstruction) {
                        return observableOf<Node>(null);
                    }

                    return this._navigator.graphService.cacheNode$(nextInstruction.key);
                }));

        this._disposable = observableCombineLatest(
                cacheNode$,
                this.configuration$).pipe(
            map(
                ([node, conf]: [Node, IRouteConfiguration]): IConfAndNode => {
                    return {conf: conf, node: node};
                }),
            filter(
                (cAN: IConfAndNode) => {
                    return cAN.node !== null && cAN.conf.playing;
                }),
            pluck<IConfAndNode, Node>("node"))
            .subscribe(this._navigator.stateService.appendNode$);

        this._disposableDescription = observableCombineLatest(
                this._navigator.stateService.currentNode$,
                routeTrack$,
                this.configuration$).pipe(
            map(
                ([node, routeTrack, conf]: [Node, RouteTrack, IRouteConfiguration]): string => {
                    if (conf.playing !== undefined && !conf.playing) {
                        return "quit";
                    }

                    let description: string = null;

                    for (let nodeInstruction of routeTrack.nodeInstructions) {
                        if (nodeInstruction.key === node.key) {
                            description = nodeInstruction.description;
                            break;
                        }
                    }

                    return description;
                }),
            scan(
                (descriptionState: DescriptionState, description: string): DescriptionState => {
                    if (description !== descriptionState.description && description !== null) {
                        descriptionState.description = description;
                        descriptionState.showsLeft = 6;
                    } else {
                        descriptionState.showsLeft--;
                    }

                    if (description === "quit") {
                        descriptionState.description = null;
                    }

                    return descriptionState;
                },
                new DescriptionState(),
            ),
            map(
                (descriptionState: DescriptionState): IVNodeHash => {
                    if (descriptionState.showsLeft > 0 && descriptionState.description) {
                        return {name: this._name, vnode: this._getRouteAnnotationNode(descriptionState.description)};
                    } else {
                        return {name: this._name, vnode: vd.h("div", [])};
                    }
                }))
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.unsubscribe();
        this._disposableDescription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IRouteConfiguration {
        return {};
    }

    private _getRouteAnnotationNode(description: string): vd.VNode {
        return vd.h("div.RouteFrame", {}, [
            vd.h("p", {textContent: description}, []),
        ]);
    }
}

ComponentService.register(RouteComponent);
export default RouteComponent;
