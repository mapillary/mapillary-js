import * as pako from "pako";
import * as falcor from "falcor";
import { FalcorDataProvider } from "../../../src/api/falcor/FalcorDataProvider";
import { ClusterReconstructionContract } from "../../../src/api/contracts/ClusterReconstructionContract";
import { CoreImageEnt } from "../../../src/api/ents/CoreImageEnt";
import { FalcorModelCreator } from "../../../src/api/falcor/FalcorModelCreator";
import { MapillaryError } from "../../../src/error/MapillaryError";
import { SpatialImagesContract } from "../../../src/api/contracts/SpatialImagesContract";
import { ImagesContract } from "../../../src/export/APINamespace";

describe("FalcorDataProvider.ctor", () => {
    it("should create a data provider", () => {
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        expect(provider).toBeDefined();
    });
});

describe("FalcorDataProvider.getFillImages", () => {
    it("should call model correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        const model: falcor.Model = new falcor.Model();
        const modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getSpatialImages([key])
            .then(
                (result: SpatialImagesContract): void => {
                    expect(result).toBeDefined();

                    expect(modelSpy.calls.count()).toBe(1);
                    expect(modelSpy.calls.first().args.length).toBe(1);
                    expect(modelSpy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(modelSpy.calls.first().args[0][1].length).toBe(1);
                    expect(modelSpy.calls.first().args[0][1][0]).toBe(key);

                    done();
                });
    });

    it("should throw when result is undefined", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const model: falcor.Model = new falcor.Model();
        const modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getSpatialImages([key])
            .catch(
                (err: Error): void => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getSpatialImages([key])
            .then(
                (): void => { return; },
                (): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(key);

                    done();
                },
            );
    });

    it("should invalidate model for every error on retry", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        Promise
            .all([
                provider.getSpatialImages([key]),
                provider.getSpatialImages([key]),
                provider.getSpatialImages([key])])
            .then(
                (): void => { return; },
                (): void => {
                    expect(invalidateSpy.calls.count()).toBe(3);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(key);

                    done();
                });
    });
});

describe("FalcorDataProvider.getFullImages", () => {
    it("should call model correctly", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getImages([key])
            .then(
                (result: ImagesContract): void => {
                    expect(result).toBeDefined();

                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(spy.calls.first().args[0][1].length).toBe(1);
                    expect(spy.calls.first().args[0][1][0]).toBe(key);

                    done();
                });
    });

    it("should throw when result is undefined", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void): void => {
                resolve(undefined);
            },
        };

        const model: falcor.Model = new falcor.Model();
        const modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getImages([key])
            .catch(
                (err: Error): void => {
                    expect(err).toBeDefined();
                    expect(err instanceof Error).toBe(true);

                    done();
                })
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const key: string = "key";

        provider.getImages([key])
            .then(
                (): void => { return; },
                (): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(key);

                    done();
                },
            );
    });
});

describe("FalcorDataProvider.getCoreImages", () => {
    it("should call model correctly", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imagesByH: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const h: string = "h";

        provider.getCoreImages(h)
            .then(
                (result: { [key: string]: { [index: string]: CoreImageEnt } }): void => {
                    expect(result).toBeDefined();

                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("imagesByH");
                    expect(spy.calls.first().args[0][1].length).toBe(1);
                    expect(spy.calls.first().args[0][1][0]).toBe(h);

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const h: string = "h";

        provider.getCoreImages(h)
            .then(
                (result: { [key: string]: { [index: string]: CoreImageEnt } }): void => { return; },
                (error: Error): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imagesByH");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(h);

                    done();
                },
            );
    });

    it("should handle undefined response", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const h: string = "h";

        provider.getCoreImages(h)
            .then(
                (result: { [key: string]: { [index: string]: CoreImageEnt } }): void => {
                    expect(result).toBeDefined();
                    expect(result[h]).toBeDefined();

                    done();
                });
    });
});

describe("FalcorDataProvider.getSequences", () => {
    it("should call model correctly", (done: Function) => {
        spyOn(console, "warn").and.stub();

        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result): void => {
                    expect(result).toBeDefined();

                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("sequenceByKey");
                    expect(spy.calls.first().args[0][1].length).toBe(1);
                    expect(spy.calls.first().args[0][1][0]).toBe(skey);

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        const invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (): void => { return; },
                (): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("sequenceByKey");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(skey);

                    done();
                },
            );
    });

    it("should call model correctly", (done: Function) => {
        spyOn(console, "warn").and.stub();

        const skey: string = "skey";
        const nkey: string = "nkey";

        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: { skey: { key: skey, keys: [nkey] } } } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        provider.getSequences([skey])
            .then(
                (result): void => {
                    expect(result).toBeDefined();
                    expect(result[0]).toBeDefined();
                    expect(result[0].node_id).toBe(skey);
                    expect(result[0].node.image_ids.length).toBe(1);
                    expect(result[0].node.image_ids[0]).toBe(nkey);

                    done();
                });
    });

    it("should create empty sequence if return value is not defined", (done: Function) => {
        spyOn(console, "warn").and.stub();

        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result): void => {
                    expect(result).toBeDefined();
                    expect(result[0]).toBeDefined();
                    expect(result[0].node_id).toBe(skey);
                    expect(result[0].node.id).toBe(skey);
                    expect(result[0].node.image_ids.length).toBe(0);

                    done();
                });
    });

    it("should populate empty sequence if missing", (done: Function) => {
        spyOn(console, "warn").and.stub();

        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result): void => {
                    expect(result).toBeDefined();
                    expect(result[0]).toBeDefined();
                    expect(result[0].node_id).toBe(skey);
                    expect(result[0].node.id).toBe(skey);
                    expect(result[0].node.image_ids.length).toBe(0);

                    done();
                });
    });
});

describe("FalcorDataProvider.setToken", () => {
    it("should invalidate old model and create a new with token", () => {
        const model: falcor.Model = new falcor.Model();

        const modelSpy: jasmine.Spy = spyOn(model, "invalidate");

        const creator: FalcorModelCreator = new FalcorModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: FalcorDataProvider = new FalcorDataProvider({
            clientToken: "cid",
            creator: creator,
        });

        provider.setUserToken("token");

        expect(modelSpy.calls.count()).toBe(1);

        expect(creatorSpy.calls.count()).toBe(2);
        expect(creatorSpy.calls.first().args.length).toBe(2);
        expect(creatorSpy.calls.first().args[0]).toContain("cid");
        expect(creatorSpy.calls.first().args[1]).toBeUndefined();
        expect(creatorSpy.calls.mostRecent().args.length).toBe(2);
        expect(creatorSpy.calls.mostRecent().args[0]).toContain("cid");
        expect(creatorSpy.calls.mostRecent().args[1]).toBe("token");
    });
});

class XMLHTTPRequestMock {
    public response: {};
    public responseType: string;
    public status: number;
    public timeout: number;

    public onload: (e: Event) => any;
    public onerror: (e: Event) => any;
    public ontimeout: (e: Event) => any;
    public onabort: (e: Event) => any;

    public abort(): void { this.onabort(new Event("abort")); }
    public open(...args: any[]): void { return; }
    public send(...args: any[]): void { return; }
};

describe("FalcorDataProvider.getImage", () => {
    it("should return array buffer on successful load", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getImageBuffer("url", abort)
            .then(
                (buffer: ArrayBuffer): void => {
                    expect(buffer instanceof ArrayBuffer).toBe(true);
                    expect(buffer).toEqual(response);
                    done();
                });

        requestMock.status = 200;
        requestMock.response = response;
        requestMock.onload(undefined);
    });

    it("should reject on abort", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        provider.getImageBuffer("url", abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("abort");

                    done();
                });

        aborter();
    });

    it("should reject on unsuccessful load", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getImageBuffer("url", abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("status");

                    done();
                });

        requestMock.status = 404;
        requestMock.response = response;
        requestMock.onload(undefined);
    });

    it("should reject for empty response on load", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getImageBuffer("url", abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("empty");

                    done();
                });

        requestMock.status = 200;
        requestMock.response = undefined;
        requestMock.onload(undefined);
    });

    it("should reject on error", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getImageBuffer("url", abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("error");

                    done();
                });

        requestMock.onerror(undefined);
    });
});

describe("FalcorDataProvider.getClusterReconstruction", () => {
    it("should return cluster reconstruction on successful load", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const provider: FalcorDataProvider = new FalcorDataProvider({ clientToken: "cid" });

        provider.getClusterReconstruction("url")
            .then(
                (r: ClusterReconstructionContract): void => {
                    expect(r.points).toEqual({});
                    expect(r.reference.alt).toBe(1);
                    expect(r.reference.lat).toBe(2);
                    expect(r.reference.lon).toBe(3);

                    done();
                });

        const response: string = pako.deflate(
            JSON.stringify([{
                points: {},
                reference_lla: { altitude: 1, latitude: 2, longitude: 3 },
            }]),
            { to: "string" });

        requestMock.status = 200;
        requestMock.response = response;
        requestMock.onload(undefined);
    });
});
