/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
} from "../Component";
import {Node} from "../Graph";
import {IVNodeHash} from "../Render";
import {Urls} from "../Utils";
import {
    Container,
    Navigator,
} from "../Viewer";

export class AttributionComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "attribution";
    private _disposable: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        this._disposable = this._navigator.stateService.currentNode$
            .map(
                (node: Node): IVNodeHash => {
                    return {name: this._name, vnode: this._getAttributionNode(node.username, node.key, node.capturedAt)};
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._disposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }

    private _getAttributionNode(username: string, key: string, capturedAt: number): vd.VNode {
        const mapillaryIcon: vd.VNode = vd.h("div.AttributionMapillaryIcon", []);
        const mapillaryLink: vd.VNode = vd.h("a.AttributionIconContainer", { href: Urls.explore, target: "_blank" }, [mapillaryIcon]);

        const imageByContent: vd.VNode = vd.h("div.AttributionUsername", { textContent: `image by ${username}` }, []);

        const date: string[] = new Date(capturedAt).toDateString().split(" ");
        const formatted: string = date.length > 3 ?
            [date[1], date[2] + ",", date[3]].join(" ") :
            date.join(" ");
        const dateContent: vd.VNode = vd.h("div.AttributionDate", { textContent: formatted }, []);

        const imageLink: vd.VNode =
            vd.h(
                "a.AttributionImageContainer",
                { href: Urls.exporeImage(key), target: "_blank" },
                [imageByContent, dateContent]);

        return vd.h("div.AttributionContainer", {}, [mapillaryLink, imageLink]);
    }
}

ComponentService.register(AttributionComponent);
export default AttributionComponent;
