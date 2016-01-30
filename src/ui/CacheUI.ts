/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IEdge, EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {UIService, UI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class CacheUI extends UI {
    public static uiName: string = "cache";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.subscribe((node: Node) => {
            _.map(node.edges, (edge: IEdge): void => {
                if (edge.data.direction === EdgeDirection.NEXT) {
                    this._navigator.graphService.node$(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.NEXT) {
                                this._navigator.graphService.node$(edge2.to).first().subscribe();
                            }
                        });
                    });
                }

                if (edge.data.direction === EdgeDirection.PREV) {
                    this._navigator.graphService.node$(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.PREV) {
                                this._navigator.graphService.node$(edge2.to).first().subscribe();
                            }
                        });
                    });
                }
            });
        });
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }
}

UIService.register(CacheUI);
export default CacheUI;
