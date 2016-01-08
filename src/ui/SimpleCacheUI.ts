/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {IEdge} from "../Edge";
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
        this.disposable = this.navigator.stateService2.currentNode.subscribe((node: Node) => {
            _.map(node.edges, (edge: IEdge): void => {
                this.navigator.graphService.getNode(edge.to).first().subscribe();
            });
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default SimpleCacheUI;
