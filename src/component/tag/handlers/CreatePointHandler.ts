import {map, filter} from "rxjs/operators";
import {Subscription} from "rxjs";

import {
    CreateHandlerBase,
    PointGeometry,
} from "../../../Component";

export class CreatePointHandler extends CreateHandlerBase {
    private _geometryCreatedSubscription: Subscription;

    protected _enableCreate(): void {
        this._container.mouseService.deferPixels(this._name, 4);

        this._geometryCreatedSubscription = this._mouseEventToBasic$(this._container.mouseService.proximateClick$).pipe(
            filter(this._validateBasic),
            map(
                (basic: number[]): PointGeometry => {
                    return new PointGeometry(basic);
                }))
            .subscribe(this._geometryCreated$);
    }

    protected _disableCreate(): void {
        this._container.mouseService.undeferPixels(this._name);

        this._geometryCreatedSubscription.unsubscribe();
    }

    protected _getNameExtension(): string {
        return "create-point";
    }
}

export default CreatePointHandler;
