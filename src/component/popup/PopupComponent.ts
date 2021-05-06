import {
    combineLatest as observableCombineLatest,
    from as observableFrom,
    merge as observableMerge,
    Observable,
    Subject,
} from "rxjs";

import {
    map,
    mergeMap,
    startWith,
    switchMap,
    withLatestFrom,
} from "rxjs/operators";

import { Transform } from "../../geo/Transform";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { RenderCamera } from "../../render/RenderCamera";
import { DOM } from "../../util/DOM";
import { ComponentConfiguration } from "../interfaces/ComponentConfiguration";
import { Component } from "../Component";
import { Popup } from "./popup/Popup";
import { ComponentName } from "../ComponentName";

/**
 * @class PopupComponent
 *
 * @classdesc Component for showing HTML popup objects.
 *
 * The `add` method is used for adding new popups. Popups are removed by reference.
 *
 * It is not possible to update popups in the set by updating any properties
 * directly on the popup object. Popups need to be replaced by
 * removing them and creating new ones with relevant changed properties and
 * adding those instead.
 *
 * Popups are only relevant to a single image because they are based on
 * 2D basic image coordinates. Popups related to a certain image should
 * be removed when the viewer is moved to another image.
 *
 * To retrive and use the popup component
 *
 * @example
 * ```js
 * var viewer = new Viewer({ component: { popup: true }, ... });
 *
 * var popupComponent = viewer.getComponent("popup");
 * ```
 */
export class PopupComponent extends Component<ComponentConfiguration> {
    public static componentName: ComponentName = "popup";

    private _dom: DOM;

    private _popupContainer: HTMLDivElement;
    private _popups: Popup[];

    private _added$: Subject<Popup[]>;
    private _popups$: Subject<Popup[]>;

    /** @ignore */
    constructor(
        name: string,
        container: Container,
        navigator: Navigator,
        dom?: DOM) {

        super(name, container, navigator);

        this._dom = !!dom ? dom : new DOM();
        this._popups = [];

        this._added$ = new Subject<Popup[]>();
        this._popups$ = new Subject<Popup[]>();
    }

    /**
     * Add popups to the popups set.
     *
     * @description Adding a new popup never replaces an old one
     * because they are stored by reference. Adding an already
     * existing popup has no effect.
     *
     * @param {Array<Popup>} popups - Popups to add.
     *
     * @example
     * ```js
     * popupComponent.add([popup1, popup2]);
     * ```
     */
    public add(popups: Popup[]): void {
        for (const popup of popups) {
            if (this._popups.indexOf(popup) !== -1) {
                continue;
            }

            this._popups.push(popup);

            if (this._activated) {
                popup.setParentContainer(this._popupContainer);
            }
        }

        this._added$.next(popups);
        this._popups$.next(this._popups);
    }

    /**
     * Returns an array of all popups.
     *
     * @example
     * ```js
     * var popups = popupComponent.getAll();
     * ```
     */
    public getAll(): Popup[] {
        return this._popups.slice();
    }

    /**
     * Remove popups based on reference from the popup set.
     *
     * @param {Array<Popup>} popups - Popups to remove.
     *
     * @example
     * ```js
     * popupComponent.remove([popup1, popup2]);
     * ```
     */
    public remove(popups: Popup[]): void {
        for (const popup of popups) {
            this._remove(popup);
        }

        this._popups$.next(this._popups);
    }

    /**
     * Remove all popups from the popup set.
     *
     * @example
     * ```js
     * popupComponent.removeAll();
     * ```
     */
    public removeAll(): void {
        for (const popup of this._popups.slice()) {
            this._remove(popup);
        }

        this._popups$.next(this._popups);
    }

    protected _activate(): void {
        this._popupContainer = this._dom.createElement("div", "mapillary-popup-container", this._container.container);

        for (const popup of this._popups) {
            popup.setParentContainer(this._popupContainer);
        }

        const subs = this._subscriptions;

        subs.push(observableCombineLatest(
            this._container.renderService.renderCamera$,
            this._container.renderService.size$,
            this._navigator.stateService.currentTransform$)
            .subscribe(
                ([renderCamera, size, transform]: [RenderCamera, ViewportSize, Transform]): void => {
                    for (const popup of this._popups) {
                        popup.update(renderCamera, size, transform);
                    }
                }));

        const changed$ = this._popups$.pipe(
            startWith(this._popups),
            switchMap(
                (popups: Popup[]): Observable<Popup> => {
                    return observableFrom(popups).pipe(
                        mergeMap(
                            (popup: Popup): Observable<Popup> => {
                                return popup.changed$;
                            }));
                }),
            map(
                (popup: Popup): Popup[] => {
                    return [popup];
                }));

        subs.push(observableMerge(this._added$, changed$).pipe(
            withLatestFrom(
                this._container.renderService.renderCamera$,
                this._container.renderService.size$,
                this._navigator.stateService.currentTransform$))
            .subscribe(
                ([popups, renderCamera, size, transform]: [Popup[], RenderCamera, ViewportSize, Transform]): void => {
                    for (const popup of popups) {
                        popup.update(renderCamera, size, transform);
                    }
                }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();

        for (const popup of this._popups) {
            popup.remove();
        }

        this._container.container.removeChild(this._popupContainer);
        delete this._popupContainer;
    }

    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }

    private _remove(popup: Popup): void {
        const index: number = this._popups.indexOf(popup);
        if (index === -1) {
            return;
        }

        const removed: Popup = this._popups.splice(index, 1)[0];
        if (this._activated) {
            removed.remove();
        }
    }
}
