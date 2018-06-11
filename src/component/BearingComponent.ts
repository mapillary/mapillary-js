import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {
    Component,
    ComponentService,
    IComponentConfiguration,
} from "../Component";
import {
    Spatial,
    Transform,
} from "../Geo";
import {Node} from "../Graph";
import {
    IVNodeHash,
    RenderCamera,
} from "../Render";
import {IFrame} from "../State";
import {
    Container,
    Navigator,
} from "../Viewer";

export class BearingComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "bearing";

    private _spatial: Spatial;
    private _svgNamespace: string;
    private _distinctThreshold: number;

    private _renderSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._spatial = new Spatial();
        this._svgNamespace = "http://www.w3.org/2000/svg";
        this._distinctThreshold = Math.PI / 360;
    }

    protected _activate(): void {
        let cameraBearingFov$: Observable<[number, number]> = this._container.renderService.renderCamera$
            .map(
                (rc: RenderCamera): [number, number] => {
                    let vFov: number = this._spatial.degToRad(rc.perspective.fov);
                    let hFov: number = rc.perspective.aspect === Number.POSITIVE_INFINITY ?
                        Math.PI :
                        Math.atan(rc.perspective.aspect * Math.tan(0.5 * vFov)) * 2;

                    return [this._spatial.azimuthalToBearing(rc.rotation.phi), hFov];
                })
            .distinctUntilChanged(
                (a1: [number, number], a2: [number, number]): boolean => {
                    return Math.abs(a2[0] - a1[0]) < this._distinctThreshold &&
                        Math.abs(a2[1] - a1[1]) < this._distinctThreshold;
                });

        this._renderSubscription = cameraBearingFov$
            .map(
                ([bearing, fov]: [number, number]): IVNodeHash => {
                    const background: vd.VNode = vd.h("div.BearingIndicatorBackground", {}, []);
                    const backgroundCircle: vd.VNode = vd.h("div.BearingIndicatorBackgroundCircle", {}, []);
                    const north: vd.VNode = this._createNorth(bearing);
                    const cameraSector: vd.VNode = this._createCircleSectorCompass(
                            this._createCircleSector(Math.max(Math.PI / 20, fov), "#FFF"));

                    return {
                        name: this._name,
                        vnode: vd.h(
                            "div.BearingIndicatorContainer",
                            { oncontextmenu: (event: MouseEvent): void => { event.preventDefault(); } },
                            [
                                background,
                                backgroundCircle,
                                north,
                                cameraSector,
                            ]),
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

    private _createCircleSectorCompass(cameraSector: vd.VNode): vd.VNode {
        let group: vd.VNode =
            vd.h(
                "g",
                {
                    attributes: { transform: "translate(1,1)" },
                    namespace: this._svgNamespace,
                },
                [cameraSector]);

        let svg: vd.VNode =
            vd.h(
                "svg",
                {
                    attributes: { viewBox: "0 0 2 2" },
                    namespace: this._svgNamespace,
                    style: {
                        height: "30px",
                        left: "4px",
                        position: "absolute",
                        top: "4px",
                        width: "30px",
                    },
                },
                [group]);

        return svg;
    }

    private _createCircleSector(fov: number, fill: string): vd.VNode {
        if (fov > 2 * Math.PI - Math.PI / 90) {
            return vd.h(
            "circle",
            {
                attributes: { cx: "0", cy: "0", fill: fill, r: "1" },
                namespace: this._svgNamespace,
            },
            []);
        }

        let arcStart: number = -Math.PI / 2 - fov / 2;
        let arcEnd: number = arcStart + fov;

        let startX: number = Math.cos(arcStart);
        let startY: number = Math.sin(arcStart);

        let endX: number = Math.cos(arcEnd);
        let endY: number = Math.sin(arcEnd);

        let largeArc: number = fov >= Math.PI ? 1 : 0;

        let description: string = `M 0 0 ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY}`;

        return vd.h(
            "path",
            {
                attributes: { d: description, fill: fill },
                namespace: this._svgNamespace,
            },
            []);
    }

    private _createNorth(bearing: number): vd.VNode {
        const north: vd.VNode = vd.h("div.BearingNorth", []);
        const container: vd.VNode = vd.h(
            "div.BearingNorthContainer",
            { style: { transform: `rotateZ(${-bearing * 180 / Math.PI}deg)` } },
            [north]);

        return container;
    }
}

ComponentService.register(BearingComponent);
export default BearingComponent;
