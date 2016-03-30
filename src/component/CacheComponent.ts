/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";

import {EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component} from "../Component";
import {Container, Navigator} from "../Viewer";

export class CacheComponent extends Component {
    public static componentName: string = "cache";

    private _prespectiveDirections: EdgeDirection[];
    private _panoDirections: EdgeDirection[];

    private _nodeSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._prespectiveDirections = [
            EdgeDirection.Prev,
            EdgeDirection.Next,
            EdgeDirection.StepLeft,
            EdgeDirection.StepRight,
            EdgeDirection.StepForward,
            EdgeDirection.StepBackward,
            EdgeDirection.Pano,
        ];

        this._panoDirections = [
            EdgeDirection.Prev,
            EdgeDirection.Next,
            EdgeDirection.Pano,
        ];
    }

    protected _activate(): void {
        this._nodeSubscription = this._navigator.stateService.currentNode$
            .map<string[]>(
                (node: Node): string[] => {
                    let keys: string[] = [];

                    for (let edge of node.edges) {
                        if (node.pano) {
                            if (this._panoDirections.indexOf(edge.data.direction) === -1) {
                                continue;
                            }
                        } else {
                            if (this._prespectiveDirections.indexOf(edge.data.direction) === -1) {
                                continue;
                            }
                        }

                        keys.push(edge.to);
                    }

                    return keys;
                })
            .flatMapLatest<Node>(
                (keys: string[]): rx.Observable<Node> => {
                    return rx.Observable
                        .from(keys)
                        .distinct()
                        .flatMap<Node>(
                            (key: string): rx.Observable<Node> => {
                                return this._navigator.graphService.node$(key);
                            });
                })
            .subscribe();
    }

    protected _deactivate(): void {
        this._nodeSubscription.dispose();
    }
}

ComponentService.register(CacheComponent);
export default CacheComponent;
