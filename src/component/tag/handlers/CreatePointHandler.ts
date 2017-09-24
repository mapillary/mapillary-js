import {Subscription} from "rxjs/Subscription";

import {
    CreateHandlerBase,
    PointGeometry,
} from "../../../Component";

export class CreatePointHandler extends CreateHandlerBase {
    private _geometryCreatedSubscription: Subscription;

    protected _enable(): void {
        this._geometryCreatedSubscription = this._mouseEventToBasic$(this._container.mouseService.staticClick$)
            .filter(this._validateBasic)
            .map(
                (basic: number[]): PointGeometry => {
                    return new PointGeometry(basic);
                })
            .subscribe(this._geometryCreated$);
    }

    protected _disable(): void {
        this._geometryCreatedSubscription.unsubscribe();
    }
}

export default CreatePointHandler;
