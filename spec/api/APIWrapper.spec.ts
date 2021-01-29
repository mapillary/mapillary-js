import { empty as observableEmpty, Observable } from "rxjs";

import { catchError } from "rxjs/operators";
import { APIWrapper } from "../../src/api/APIWrapper";
import { FalcorDataProvider } from "../../src/api/FalcorDataProvider";
import { ICoreNode } from "../../src/api/interfaces/ICoreNode";
import { IFillNode } from "../../src/api/interfaces/IFillNode";
import { ISequence } from "../../src/api/interfaces/ISequence";

describe("APIWrapperctor", () => {
    it("should create an APIWrapper instance", () => {
        const api: APIWrapper = new APIWrapper(undefined);
        expect(api).toBeDefined();
    });
});

describe("APIWrapperimageByKeyFill$", () => {
    it("should call data provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getFillImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.imageByKeyFill$([key])
            .subscribe(
                (result: { [key: string]: IFillNode }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(key);

                    done();
                });
    });

    it("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getFillImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.imageByKeyFill$([key]).pipe(
            catchError(
                (err: Error): Observable<{}> => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    return observableEmpty();
                }))
            .subscribe(
                undefined,
                undefined,
                (): void => { done(); });
    });
});

describe("APIWrapperimageByKeyFull$", () => {
    it("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getFullImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.imageByKeyFull$([key])
            .subscribe(
                (result: { [key: string]: IFillNode }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(key);

                    done();
                });
    });

    it("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getFullImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.imageByKeyFull$([key]).pipe(
            catchError(
                (err: Error): Observable<{}> => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    return observableEmpty();
                }))
            .subscribe(
                undefined,
                undefined,
                (): void => { done(); });
    });
});

describe("APIWrapperimagesByH$", () => {
    it("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getCoreImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const h: string = "h";

        api.imagesByH$(h)
            .subscribe(
                (result: { [key: string]: { [index: string]: ICoreNode } }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(h);

                    done();
                });
    });

    it("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getCoreImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const h: string = "h";

        api.imagesByH$(h).pipe(
            catchError(
                (err: Error): Observable<{}> => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    return observableEmpty();
                }))
            .subscribe(
                undefined,
                undefined,
                (): void => { done(); });
    });
});

describe("APIWrappersequenceByKey$", () => {
    it("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getSequences");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const skey: string = "skey";

        api.sequenceByKey$([skey])
            .subscribe(
                (result: { [key: string]: ISequence }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(skey);

                    done();
                });
    });

    it("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "getSequences");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const skey: string = "skey";

        api.sequenceByKey$([skey]).pipe(
            catchError(
                (err: Error): Observable<{}> => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    return observableEmpty();
                }))
            .subscribe(
                undefined,
                undefined,
                (): void => { done(); });
    });
});

describe("APIWrappersetToken", () => {
    it("should call provider correctly", () => {
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });
        const providerSpy: jasmine.Spy = spyOn(provider, "setUserToken");

        const api: APIWrapper = new APIWrapper(provider);

        api.setUserToken("token");

        expect(providerSpy.calls.count()).toBe(1);
        expect(providerSpy.calls.first().args[0]).toBe("token");
    });
});
