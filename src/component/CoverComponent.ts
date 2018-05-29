/// <reference path="../../typings/index.d.ts" />

import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    CoverState,
    ICoverConfiguration,
    ComponentService,
    Component,
} from "../Component";
import {Node} from "../Graph";
import {
    IVNodeHash,
    ISize,
} from "../Render";
import {Urls} from "../Utils";
import {
    Container,
    ImageSize,
    Navigator,
} from "../Viewer";

export class CoverComponent extends Component<ICoverConfiguration> {
    public static componentName: string = "cover";

    private _renderSubscription: Subscription;
    private _keySubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    public _activate(): void {
        this._keySubscription = this._navigator.stateService.currentNode$
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
                    return { key: node.key, src: null };
                })
            .subscribe(this._configurationSubject$);

        this._renderSubscription = Observable
            .combineLatest(
                this._configuration$,
                this._container.renderService.size$)
            .map(
                ([configuration, size]: [ICoverConfiguration, ISize]): IVNodeHash => {
                    if (!configuration.key) {
                        return { name: this._name, vnode: vd.h("div", []) };
                    }

                    const compactClass: string = size.width <= 640 || size.height <= 480 ? ".CoverCompact" : "";

                    if (configuration.state === CoverState.Hidden) {
                        const doneContainer: vd.VNode = vd.h(
                            "div.CoverContainer.CoverDone" + compactClass,
                            [this._getCoverBackgroundVNode(configuration)]);

                        return { name: this._name, vnode: doneContainer };
                    }

                    const container: vd.VNode = vd.h(
                        "div.CoverContainer" + compactClass,
                        [this._getCoverButtonVNode(configuration)]);

                    return { name: this._name, vnode: container };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    public _deactivate(): void {
        this._renderSubscription.unsubscribe();
        this._keySubscription.unsubscribe();
    }

    protected _getDefaultConfiguration(): ICoverConfiguration {
        return { state: CoverState.Visible };
    }

    private _getCoverButtonVNode(configuration: ICoverConfiguration): vd.VNode {
        const cover: string = configuration.state === CoverState.Loading ? "div.Cover.CoverLoading" : "div.Cover";
        const coverButton: vd.VNode = vd.h(
            "div.CoverButton",
            { onclick: (): void => { this.configure({ state: CoverState.Loading }); } },
            [vd.h("div.CoverButtonIcon", [])]);

        const coverLogo: vd.VNode = vd.h("a.CoverLogo", {href: Urls.explore, target: "_blank"}, []);

        return vd.h(cover, [this._getCoverBackgroundVNode(configuration), coverButton, coverLogo]);
    }

    private _getCoverBackgroundVNode(conf: ICoverConfiguration): vd.VNode {
        let url: string = conf.src != null ?
            conf.src : Urls.thumbnail(conf.key, ImageSize.Size640);

        let properties: vd.createProperties = { style: { backgroundImage: `url(${url})` } };

        let children: vd.VNode[] = [];
        if (conf.state === CoverState.Loading) {
            children.push(vd.h("div.Spinner", {}, []));
        }

        return vd.h("div.CoverBackground", properties, children);
    }
}

ComponentService.registerCover(CoverComponent);
export default CoverComponent;
