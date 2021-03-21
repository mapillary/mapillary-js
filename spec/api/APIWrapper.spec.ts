import { empty as observableEmpty, Observable } from "rxjs";

import { catchError } from "rxjs/operators";
import { APIWrapper } from "../../src/api/APIWrapper";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { SequenceEnt } from "../../src/api/ents/SequenceEnt";
import { DataProvider } from "../helper/ProviderHelper";

describe("APIWrapperctor", () => {
    test("should create an APIWrapper instance", () => {
        const api: APIWrapper = new APIWrapper(undefined);
        expect(api).toBeDefined();
    });
});

describe("APIWrapperimageByKeyFill$", () => {
    test("should call data provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getSpatialImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.getSpatialImages$([key])
            .subscribe(
                (result: { [key: string]: SpatialImageEnt }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(key);

                    done();
                });
    });

    test("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getSpatialImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.getSpatialImages$([key]).pipe(
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
    test("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.getImages$([key])
            .subscribe(
                (result: { [key: string]: SpatialImageEnt }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(key);

                    done();
                });
    });

    test("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const key: string = "key";

        api.getImages$([key]).pipe(
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
    test("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getCoreImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const h: string = "h";

        api.getCoreImages$(h)
            .subscribe(
                (result: { [key: string]: { [index: string]: CoreImageEnt } }): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(h);

                    done();
                });
    });

    test("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getCoreImages");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const h: string = "h";

        api.getCoreImages$(h).pipe(
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
    test("should call provider correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({});
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getSequences");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const skey: string = "skey";

        api.getSequences$([skey])
            .subscribe(
                (result): void => {
                    expect(result).toBeDefined();

                    expect(providerSpy.calls.count()).toBe(1);
                    expect(providerSpy.calls.first().args[0].length).toBe(1);
                    expect(providerSpy.calls.first().args[0][0]).toBe(skey);

                    done();
                });
    });

    test("should pass on error", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "getSequences");
        providerSpy.and.returnValue(promise);

        const api: APIWrapper = new APIWrapper(provider);

        const skey: string = "skey";

        api.getSequences$([skey]).pipe(
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
    test("should call provider correctly", () => {
        const provider = new DataProvider();
        const providerSpy: jasmine.Spy = spyOn(provider, "setUserToken");

        const api: APIWrapper = new APIWrapper(provider);

        api.setUserToken("token");

        expect(providerSpy.calls.count()).toBe(1);
        expect(providerSpy.calls.first().args[0]).toBe("token");
    });
});
