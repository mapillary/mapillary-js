/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {ComponentService, Component, IComponentConfiguration} from "../Component";
import {NewNode} from "../Graph";
import {IVNodeHash} from "../Render";
import {Container, Navigator} from "../Viewer";

export class BearingComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "bearing";

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._renderSubscription = this._navigator.stateService.currentNode$
            .map<boolean>(
                (node: NewNode): boolean => {
                    return node.fullPano;
                })
            .map<IVNodeHash>(
                (pano: boolean): IVNodeHash => {
                    return {
                        name: this._name,
                        vnode: pano ? vd.h("div.BearingIndicator", {}, []) : vd.h("div", {}, []),
                    };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._renderSubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
