/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Subscription} from "rxjs/Subscription";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/map";
import "rxjs/add/operator/withLatestFrom";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {ICoverConfiguration, IComponentConfiguration, ComponentService, Component} from "../Component";

import {IVNodeHash} from "../Render";

export class CoverComponent extends Component {
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
                (nc: [Node, ICoverConfiguration]): boolean => {
                    return nc[0].key !== nc[1].key;
                })
            .map<Node>((nc: [Node, ICoverConfiguration]): Node => { return nc[0]; })
            .map<ICoverConfiguration>(
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

                    if (!conf.visible) {
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

    public get defaultConfiguration(): IComponentConfiguration {
        return { "loading": false, "visible": true };
    }

    private _getCoverButtonVNode(conf: ICoverConfiguration): vd.VNode {
        const cover: string = conf.loading ? "div.Cover.CoverLoading" : "div.Cover";
        return vd.h(cover, [
            this._getCoverBackgroundVNode(conf),
            vd.h("button.CoverButton", {onclick: (): void => { this.configure({ loading: true }); }}, ["Explore"]),
            vd.h("a.CoverLogo", {href: `https://www.mapillary.com`, target: "_blank"}, []),
        ]);
    }

    private _getCoverBackgroundVNode(conf: ICoverConfiguration): vd.VNode {
        let url: string = conf.src != null ?
            `url(${conf.src})` :
            `url(https://d1cuyjsrcm0gby.cloudfront.net/${conf.key}/thumb-640.jpg)`;
        const spinner: vd.VNode = conf.loading ? vd.h("div.Spinner", {}, []) : undefined;
        return vd.h(
          "div.CoverBackground",
          { style: { backgroundImage: url } },
          [ spinner, vd.h("div.CoverBackgroundGradient", {}, []) ]
        );
    }
}

ComponentService.registerCover(CoverComponent);
export default CoverComponent;
