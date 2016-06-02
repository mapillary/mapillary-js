/// <reference path="../../typings/index.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";
import * as vd from "virtual-dom";

import {IAPISGet} from "../API";
import {Container, Navigator} from "../Viewer";
import {Node} from "../Graph";

import {IRouteConfiguration, IRoutePath, ComponentService, Component} from "../Component";
import {IVNodeHash} from "../Render";
import {IFrame} from "../State";

// return {name: this._name, vnode: this.getRouteAnnotationNode("test")};

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

export class RouteComponent extends Component {
    public static componentName: string = "route";
    private _disposable: rx.IDisposable;
    private _disposableDescription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        let _slowedStream$: rx.Observable<IFrame>;

        _slowedStream$ = this._navigator.stateService.currentState$.filter((frame: IFrame) => {
            return (frame.id % 2) === 0;
        }).filter((frame: IFrame) => {
            return frame.state.nodesAhead < 15;
        }).distinctUntilChanged((frame: IFrame): string => {
            return frame.state.lastNode.key;
        });

        let _routeTrack$: rx.Observable<RouteTrack>;

        _routeTrack$ = this.configuration$.selectMany((conf: IRouteConfiguration): rx.Observable<IRoutePath> => {
            return rx.Observable.from(conf.paths);
        }).distinct((path: IRoutePath): string => {
            return path.sequenceKey;
        }).flatMap<IAPISGet>((path: IRoutePath): rx.Observable<IAPISGet> => {
            return rx.Observable.fromPromise(this._navigator.apiV2.s.get(path.sequenceKey));
        }).combineLatest(this.configuration$, (apiSGet: IAPISGet, conf: IRouteConfiguration): IInstructionPlace[] => {
            let i: number = 0;
            let instructionPlaces: IInstructionPlace[] = [];

            for (let path of conf.paths) {
                if (path.sequenceKey === apiSGet.key) {
                    let nodeInstructions: INodeInstruction[] = [];
                    let saveKey: boolean = false;
                    for (let key of apiSGet.keys) {
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
        }).scan<RouteTrack>(
            (routeTrack: RouteTrack, instructionPlaces: IInstructionPlace[]): RouteTrack => {
                for (let instructionPlace of instructionPlaces) {
                    routeTrack.nodeInstructionsOrdered[instructionPlace.place] = instructionPlace.nodeInstructions;
                }
                routeTrack.nodeInstructions = _.flatten(routeTrack.nodeInstructionsOrdered);
                return routeTrack;
            },
            new RouteTrack());

        this._disposable = _slowedStream$
            .combineLatest(_routeTrack$, this.configuration$,
                           (frame: IFrame, routeTrack: RouteTrack, conf: IRouteConfiguration): IRtAndFrame => {
                               return {conf: conf, frame: frame, routeTrack: routeTrack};
                           }).scan<RouteState>(
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
                               new RouteState())
            .filter((routeState: RouteState): boolean => {
                return routeState.playing;
            }).filter((routeState: RouteState): boolean => {
                for (let nodeInstruction of routeState.routeTrack.nodeInstructions) {
                    if (!nodeInstruction) {
                        continue;
                    }
                    if (nodeInstruction.key === routeState.lastNode.key) {
                        return true;
                    }
                }
                return false;
            }).distinctUntilChanged((routeState: RouteState): string => {
                return routeState.lastNode.key;
            }).selectMany<Node>((routeState: RouteState): rx.Observable<Node> => {
                let i: number = 0;
                for (let nodeInstruction of routeState.routeTrack.nodeInstructions) {
                    if (nodeInstruction.key === routeState.lastNode.key) {
                        break;
                    }
                    i++;
                }

                let nextInstruction: INodeInstruction = routeState.routeTrack.nodeInstructions[i + 1];
                if (!nextInstruction) {
                    return rx.Observable.just<Node>(null);
                }

                return this._navigator.graphService.node$(nextInstruction.key);
            }).combineLatest(this.configuration$, (node: Node, conf: IRouteConfiguration): IConfAndNode => {
                return {conf: conf, node: node};
            }).filter((cAN: IConfAndNode) => {
                return cAN.node !== null && cAN.conf.playing;
            }).pluck<Node>("node").subscribe(this._navigator.stateService.appendNode$);

        this._disposableDescription = this._navigator.stateService.currentNode$
            .combineLatest(_routeTrack$, this.configuration$,
                           (node: Node, routeTrack: RouteTrack, conf: IRouteConfiguration): string => {
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
            }).scan<DescriptionState>(
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
                new DescriptionState()
            ).map((descriptionState: DescriptionState): IVNodeHash => {
                if (descriptionState.showsLeft > 0 && descriptionState.description) {
                    return {name: this._name, vnode: this._getRouteAnnotationNode(descriptionState.description)};
                } else {
                    return {name: this._name, vnode: vd.h("div", [])};
                }
            }).subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.dispose();
        this._disposableDescription.dispose();
    }

    public play(): void {
        this.configure({ playing: true });
    }

    public stop(): void {
        this.configure({ playing: false });
    }

    private _getRouteAnnotationNode(description: string): vd.VNode {
        return vd.h("div.RouteFrame", {}, [
            vd.h("p", {textContent: description}, []),
        ]);
    }
}

ComponentService.register(RouteComponent);
export default RouteComponent;
