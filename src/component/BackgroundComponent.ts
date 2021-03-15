import * as vd from "virtual-dom";

import { Component } from "./Component";
import { IComponentConfiguration } from "./interfaces/IComponentConfiguration";

import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

export class BackgroundComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "background";

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._container.domRenderer.render$
            .next({ name: this._name, vnode: this._getBackgroundNode("The viewer can't display the given image.") });
    }

    protected _deactivate(): void {
        return;
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getBackgroundNode(notice: string): vd.VNode {
        // todo: add condition for when to display the DOM node
        return vd.h("div.mapillary-background-wrapper", {}, [
            vd.h("p", { textContent: notice }, []),
        ]);
    }
}
