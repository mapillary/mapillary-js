/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IEdge, EdgeDirection} from "../Edge";
import {Node} from "../Graph";
import {IUI} from "../UI";
import {Container, Navigator} from "../Viewer";

export class SimpleCacheUI implements IUI {
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    constructor (container: Container, navigator: Navigator) {
        this.navigator = navigator;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentNode.subscribe((node: Node) => {
            _.map(node.edges, (edge: IEdge): void => {
                if (edge.data.direction === EdgeDirection.NEXT) {
                    this.navigator.graphService.getNode(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.NEXT) {
                                this.navigator.graphService.getNode(edge2.to).first().subscribe();
                            }
                        });
                    });
                }

                if (edge.data.direction === EdgeDirection.PREV) {
                    this.navigator.graphService.getNode(edge.to).first().subscribe((node2: Node) => {
                        _.map(node2.edges, (edge2: IEdge): void => {
                            if (edge2.data.direction === EdgeDirection.PREV) {
                                this.navigator.graphService.getNode(edge2.to).first().subscribe();
                            }
                        });
                    });
                }
            });
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default SimpleCacheUI;
