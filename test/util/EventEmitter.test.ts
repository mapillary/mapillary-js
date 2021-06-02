import { EventEmitter } from "../../src/util/EventEmitter";

describe("EventEmitter.ctor", () => {
    test("should be defined", () => {
        const eventEmitter = new EventEmitter();
        expect(eventEmitter).toBeDefined();
    });
});

describe("EventEmitter.on", () => {
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        eventEmitter = new EventEmitter();
    });

    test("should emit on event", (done: Function) => {
        let data: string = "testdata";

        eventEmitter.on("test", (ev: any) => {
            expect(ev).toBe(data);
            done();
        });

        eventEmitter.fire("test", data);
    });

    test("should get two different events only once", (done: Function) => {
        let data: string = "testdata";
        let data2: string = "testdata2";

        let i: number = 0;

        eventEmitter.on("test", (ev: any) => {
            expect(ev).toBe(data);
            i++;
            expect(i).toBe(1);
        });

        eventEmitter.on("test2", (ev: any) => {
            expect(ev).toBe(data2);
            i++;
            expect(i).toBe(2);
            done();
        });

        eventEmitter.fire("test", data);
        eventEmitter.fire("test2", data2);
    });

    test("should get the same event twice", (done: Function) => {
        let data: string = "testdata";

        let i: number = 0;

        eventEmitter.on("test", (ev: any) => {
            expect(ev).toBe(data);
            i++;
            expect(i).toBe(1);
        });

        eventEmitter.on("test", (ev: any) => {
            expect(ev).toBe(data);
            i++;
            expect(i).toBe(2);
            done();
        });

        eventEmitter.fire("test", data);
    });
});

interface TestEvent {
    data: string;
    type: string;
}

describe("EventEmitter.off", () => {
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        eventEmitter = new EventEmitter();
    });

    test("should remove listener", () => {
        const event: TestEvent = { data: "testdata", type: "test" };

        let onTestCount = 0;
        const onTest = () => {
            onTestCount++;
            fail();
        };
        eventEmitter.on(event.type, onTest);
        eventEmitter.off(event.type, onTest);

        eventEmitter.fire(event.type, event);

        expect(onTestCount).toBe(0);
    });

    test("should remove specific listener", () => {
        const event: TestEvent = { data: "testdata", type: "test" };

        let count = 0;
        const onTest1 = () => {
            count++;
            fail();
        };
        const onTest2 = (e: TestEvent) => {
            count++;
            expect(e.type).toBe("test");
            expect(count).toBe(1);
        };
        eventEmitter.on(event.type, onTest1);
        eventEmitter.on(event.type, onTest2);

        eventEmitter.off(event.type, onTest1);

        eventEmitter.fire(event.type, event);

        expect(count).toBe(1);
    });

    test("should remove all listeners", () => {
        const event: TestEvent = { data: "testdata", type: "test" };

        let count = 0;
        const onTest1 = () => {
            count++;
            fail();
        };
        const onTest2 = () => {
            count++;
            fail();
        };
        eventEmitter.on(event.type, onTest1);
        eventEmitter.on(event.type, onTest2);

        eventEmitter.off(event.type, onTest1);
        eventEmitter.off(event.type, onTest2);

        eventEmitter.fire(event.type, event);

        expect(count).toBe(0);
    });
});
