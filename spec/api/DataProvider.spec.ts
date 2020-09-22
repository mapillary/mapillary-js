import {empty as observableEmpty, Observable} from "rxjs";

import {catchError, retry} from "rxjs/operators";

import * as falcor from "falcor";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
    ModelCreator,
} from "../../src/API";
import DataProvider from "../../src/api/DataProvider";

describe("DataProvider.ctor", () => {
    it("should create a data provider", () => {
        const provider: DataProvider = new DataProvider("clientId", null);

        expect(provider).toBeDefined();
    });
});

describe("DataProvider.getFillImages", () => {
    it("should call model correctly", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        const model: falcor.Model = new falcor.Model();
        const modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFillImages([key])
            .then(
                (result: { [key: string]: IFillNode}): void => {
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFillImages([key])
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFillImages([key])
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        Promise
            .all([
                provider.getFillImages([key]),
                provider.getFillImages([key]),
                provider.getFillImages([key])])
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

describe("DataProvider.getFullImages", () => {
    it("should call model correctly", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFullImages([key])
            .then(
                (result: { [key: string]: IFillNode}): void => {
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
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const model: falcor.Model = new falcor.Model();
        const modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFullImages([key])
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const key: string = "key";

        provider.getFullImages([key])
            .then(
                (result: { [key: string]: IFillNode}): void => { return; },
                (error: Error): void => {
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

describe("DataProvider.getCoreImages", () => {
    it("should call model correctly", (done: Function) => {
        const model: falcor.Model = new falcor.Model();

        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imagesByH: {} } });
            },
        };

        const spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const h: string = "h";

        provider.getCoreImages([h])
            .then(
                (result: { [key: string]: { [index: string]: ICoreNode } }): void => {
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const h: string = "h";

        provider.getCoreImages([h])
            .then(
                (result: { [key: string]: { [index: string]: ICoreNode } }): void => { return; },
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const h: string = "h";

        provider.getCoreImages([h])
            .then(
                (result: { [key: string]: { [index: string]: ICoreNode } }): void => {
                    expect(result).toBeDefined();
                    expect(result[h]).toBeDefined();

                    done();
                });
    });
});

describe("DataProvider.getSequences", () => {
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result: { [key: string]: ISequence }): void => {
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result: { [key: string]: ISequence }): void => { return; },
                (error: Error): void => {
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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        provider.getSequences([skey])
            .then(
                (result: { [key: string]: ISequence }): void => {
                    expect(result).toBeDefined();
                    expect(result[skey]).toBeDefined();
                    expect(result[skey].key).toBe(skey);
                    expect(result[skey].keys.length).toBe(1);
                    expect(result[skey].keys[0]).toBe(nkey);

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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result: { [key: string]: ISequence }): void => {
                    expect(result).toBeDefined();
                    expect(result[skey]).toBeDefined();
                    expect(result[skey].key).toBe(skey);
                    expect(result[skey].keys.length).toBe(0);

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

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        const skey: string = "skey";

        provider.getSequences([skey])
            .then(
                (result: { [key: string]: ISequence }): void => {
                    expect(result).toBeDefined();
                    expect(result[skey]).toBeDefined();
                    expect(result[skey].key).toBe(skey);
                    expect(result[skey].keys.length).toBe(0);

                    done();
                });
    });
});

describe("DataProvider.setToken", () => {
    it("should invalidate old model and create a new with token", () => {
        const model: falcor.Model = new falcor.Model();

        const modelSpy: jasmine.Spy = spyOn(model, "invalidate");

        const creator: ModelCreator = new ModelCreator();
        const creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        const provider: DataProvider = new DataProvider("clientId", undefined, creator);

        provider.setToken("token");

        expect(modelSpy.calls.count()).toBe(1);

        expect(creatorSpy.calls.count()).toBe(2);
        expect(creatorSpy.calls.first().args.length).toBe(2);
        expect(creatorSpy.calls.first().args[0]).toBe("clientId");
        expect(creatorSpy.calls.first().args[1]).toBeUndefined();
        expect(creatorSpy.calls.mostRecent().args.length).toBe(2);
        expect(creatorSpy.calls.mostRecent().args[0]).toBe("clientId");
        expect(creatorSpy.calls.mostRecent().args[1]).toBe("token");
    });
});
