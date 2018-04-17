/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import {
    CoverState,
    ICoverConfiguration,
    ComponentService,
    Component,
} from "../Component";
import {Node} from "../Graph";
import {IVNodeHash} from "../Render";
import {Urls} from "../Utils";
import {
    Container,
    ImageSize,
    Navigator,
} from "../Viewer";

export class CoverComponent extends Component<ICoverConfiguration> {
    public static componentName: string = "cover";

    private _disposable: Subscription;
    private _keyDisposable: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        this._keyDisposable = this._navigator.stateService.currentNode$
            .withLatestFrom(
                this._configuration$,
                (node: Node, configuration: ICoverConfiguration): [Node, ICoverConfiguration] => {
                    return [node, configuration];
                })
            .filter(
                ([node, configuration]: [Node, ICoverConfiguration]): boolean => {
                    return node.key !== configuration.key;
                })
            .map(([node, configuration]: [Node, ICoverConfiguration]): Node => { return node; })
            .map(
                (node: Node): ICoverConfiguration => {
                    return { key: node.key, src: node.image.src };
                })
            .subscribe(this._configurationSubject$);

        this._disposable = this._configuration$
            .map(
                (conf: ICoverConfiguration): IVNodeHash => {
                    if (!conf.key) {
                        return { name: this._name, vnode: vd.h("div", []) };
                    }

                    if (conf.state === CoverState.Hidden) {
                        return {name: this._name, vnode: vd.h("div.Cover.CoverDone", [ this._getCoverBackgroundVNode(conf) ])};
                    }

                    return { name: this._name, vnode: this._getCoverButtonVNode(conf) };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._disposable.unsubscribe();
        this._keyDisposable.unsubscribe();
    }

    protected _getDefaultConfiguration(): ICoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(conf: ICoverConfiguration): vd.VNode {
        const cover: string = conf.state === CoverState.Loading ? "div.Cover.CoverLoading" : "div.Cover";

        return vd.h(cover, [
            this._getCoverBackgroundVNode(conf),
            vd.h("button.CoverButton", { onclick: (): void => { this.configure({ state: CoverState.Loading }); } }, ["Explore"]),
            vd.h("a.CoverLogo", {href: Urls.explore, target: "_blank"}, []),
        ]);
    }

    private _getCoverBackgroundVNode(conf: ICoverConfiguration): vd.VNode {
        let url: string = conf.src != null ?
            conf.src : Urls.thumbnail(conf.key, ImageSize.Size640);

        let properties: vd.createProperties = { style: { backgroundImage: `url(${url})` } };

        let children: vd.VNode[] = [];
        if (conf.state === CoverState.Loading) {
            children.push(vd.h("div.Spinner", {}, []));
        }

        children.push(vd.h("div.CoverBackgroundGradient", {}, []));

        return vd.h("div.CoverBackground", properties, children);
    }
}

ComponentService.registerCover(CoverComponent);
export default CoverComponent;
