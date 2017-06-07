import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
    ComponentService,
    Component,
    IComponentConfiguration,
    Popup,
} from "../../Component";
import {Transform} from "../../Geo";
import {
    ISize,
    RenderCamera,
} from "../../Render";
import {
    Container,
    Navigator,
} from "../../Viewer";

export class PopupComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "popup";

    private _popupContainer: HTMLDivElement;
    private _popups: Popup[];

    private _added$: Subject<Popup[]>;
    private _popups$: Subject<Popup[]>;

    private _updateAllSubscription: Subscription;
    private _updateAddedChangedSubscription: Subscription;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._popups = [];

        this._added$ = new Subject<Popup[]>();
        this._popups$ = new Subject<Popup[]>();
    }

    public add(popups: Popup[]): void {
        for (const popup of popups) {
            this._popups.push(popup);

            if (this._activated) {
                popup.setParentContainer(this._popupContainer);
            }
        }

        this._added$.next(popups);
        this._popups$.next(this._popups);
    }

    public remove(popups: Popup[]): void {
        for (const popup of popups) {
            this._remove(popup);
        }

        this._popups$.next(this._popups);
    }

    public removeAll(): void {
        this.remove(this._popups);
    }

    protected _activate(): void {
        this._popupContainer = document.createElement("div");
        this._popupContainer.className = "PopupContainer";

        this._container.element.appendChild(this._popupContainer);

        for (const popup of this._popups) {
            popup.setParentContainer(this._popupContainer);
        }

        this._updateAllSubscription = Observable
                .combineLatest(
                    this._container.renderService.renderCamera$,
                    this._container.renderService.size$,
                    this._navigator.stateService.currentTransform$)
            .subscribe(
                ([renderCamera, size, transform]: [RenderCamera, ISize, Transform]): void => {
                    for (const popup of this._popups) {
                        popup.update(renderCamera, size, transform);
                    }
                });

        const changed$: Observable<Popup[]> = this._popups$
            .startWith(this._popups)
            .switchMap(
                (popups: Popup[]): Observable<Popup> => {
                    return Observable
                        .from(popups)
                        .mergeMap(
                            (popup: Popup): Observable<Popup> => {
                                return popup.changed$;
                            });
                })
            .map(
                (popup: Popup): Popup[] => {
                    return [popup];
                });

        this._updateAddedChangedSubscription = Observable
            .combineLatest(
                this._added$.merge(changed$),
                this._container.renderService.renderCamera$,
                this._container.renderService.size$,
                this._navigator.stateService.currentTransform$)
            .subscribe(
                ([popups, renderCamera, size, transform]: [Popup[], RenderCamera, ISize, Transform]): void => {
                    for (const popup of popups) {
                        popup.update(renderCamera, size, transform);
                    }
                });
    }

    protected _deactivate(): void {
        this._updateAllSubscription.unsubscribe();
        this._updateAddedChangedSubscription.unsubscribe();

        for (const popup of this._popups) {
            popup.remove();
        }

        this._container.element.removeChild(this._popupContainer);
        delete this._popupContainer;
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
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

ComponentService.register(PopupComponent);
export default PopupComponent;
