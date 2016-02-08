/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IEdge, EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {ComponentService, Component} from "../Component";
import {Container, Navigator} from "../Viewer";

export class CacheComponent extends Component {
    public static componentName: string = "cache";
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$.subscribe((node: Node) => {
            _.map(node.edges, (edge: IEdge): void => {
                if (edge.data.direction === EdgeDirection.Next) {
                    this._navigator.graphService.node$(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.Next) {
                                this._navigator.graphService.node$(edge2.to).first().subscribe();
                            }
                        });
                    });
                }

                if (edge.data.direction === EdgeDirection.Prev) {
                    this._navigator.graphService.node$(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.Prev) {
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

ComponentService.register(CacheComponent);
export default CacheComponent;
