import { Subscription } from "rxjs";
import SubscriptionHolder from "../../src/utils/SubscriptionHolder";

describe("SubscriptionHolder", () => {
    it("should be defined", () => {
        const subscriptions = new SubscriptionHolder();
        expect(subscriptions).toBeDefined();
    });

    it("should be able to unsubscribe without subscriptions", () => {
        const subscriptions = new SubscriptionHolder();
        subscriptions.unsubscribe();
        expect(subscriptions).toBeDefined();
    });

    it("should unsubscribe a subscription", () => {
        const subscriptions = new SubscriptionHolder();

        const sub = new Subscription();
        const unsubscribeSpy = spyOn(sub, "unsubscribe").and.stub();
        subscriptions.push(sub);

        subscriptions.unsubscribe();

        expect(unsubscribeSpy.calls.count()).toBe(1);
    });

    it("should unsubscribe all subscriptions", () => {
        const subscriptions = new SubscriptionHolder();

        const unsubscribeSpies: jasmine.Spy[] = [];
        for (let i = 0; i < 10; i++) {
            const sub = new Subscription();
            const unsubscribeSpy = spyOn(sub, "unsubscribe").and.stub();
            unsubscribeSpies.push(unsubscribeSpy);
            subscriptions.push(sub);
        }

        subscriptions.unsubscribe();

        for (const unsubscribeSpy of unsubscribeSpies) {
            expect(unsubscribeSpy.calls.count()).toBe(1);
        }
    });
});
