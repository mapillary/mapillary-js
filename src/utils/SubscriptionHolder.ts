import { Subscription } from "rxjs";

export default class SubscriptionHolder {
    private _subscriptions: Subscription[] = [];

    public push(subscription: Subscription): void {
        this._subscriptions.push(subscription);
    }

    public unsubscribe(): void {
        for (const sub of this._subscriptions) {
            sub.unsubscribe();
        }

        this._subscriptions = [];
    }
}
