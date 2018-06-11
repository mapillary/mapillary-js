import {EventEmitter} from "../../src/Utils";

describe("EventEmitter", () => {
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        eventEmitter = new EventEmitter();
    });

    it("should be defined", () => {
        expect(eventEmitter).toBeDefined();
    });

    it("should emit on event", (done: Function) => {
        let data: string = "testdata";

        eventEmitter.on("test", (ev: any) => {
            expect(ev).toBe(data);
            done();
        });

        eventEmitter.fire("test", data);
    });

    it("should get two different events only once", (done: Function) => {
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

    it("should get the same event twice", (done: Function) => {
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
