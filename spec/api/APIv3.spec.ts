import {empty as observableEmpty, Observable} from "rxjs";

import {catchError, retry} from "rxjs/operators";

import * as falcor from "falcor";

import {
    APIv3,
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
    ModelCreator,
} from "../../src/API";

describe("APIv3.ctor", () => {
    it("should create an API v3", () => {
        let apiV3: APIv3 = new APIv3("clientId", null);

        expect(apiV3).toBeDefined();
    });
});

describe("APIv3.imageByKeyFill$", () => {
    it("should call model correctly", (done: Function) => {
        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        let model: falcor.Model = new falcor.Model();
        let modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFill$([key])
            .subscribe(
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
        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let model: falcor.Model = new falcor.Model();
        let modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFill$([key]).pipe(
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

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFill$([key])
            .subscribe(
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

    it("should invalidate model for every error on retry", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFill$([key]).pipe(
            retry(5))
            .subscribe(
                (result: { [key: string]: IFillNode}): void => { return; },
                (error: Error): void => {
                    expect(invalidateSpy.calls.count()).toBe(6);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageByKey");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe(key);

                    done();
                },
            );
    });
});

describe("APIv3.imageByKeyFull$", () => {
    it("should call model correctly", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageByKey: {} } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFull$([key])
            .subscribe(
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
        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let model: falcor.Model = new falcor.Model();
        let modelSpy: jasmine.Spy = spyOn(model, "get");
        modelSpy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFull$([key]).pipe(
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

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageByKeyFull$([key])
            .subscribe(
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

describe("APIv3.imageCloseTo$", () => {
    it("should call model correctly", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imageCloseTo: { "0:0": null } } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let lat: number = 0;
        let lon: number = 0;

        apiV3.imageCloseTo$(lat, lon)
            .subscribe(
                (result: IFullNode): void => {
                    expect(result).toBeDefined();

                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("imageCloseTo");
                    expect(spy.calls.first().args[0][1].length).toBe(1);
                    expect(spy.calls.first().args[0][1][0]).toBe("0:0");

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let lat: number = 0;
        let lon: number = 0;

        apiV3.imageCloseTo$(lat, lon)
            .subscribe(
                (result: IFullNode): void => { return; },
                (error: Error): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageCloseTo");
                    expect(invalidateSpy.calls.first().args[0][1].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][1][0]).toBe("0:0");

                    done();
                },
            );
    });
});

describe("APIv3.imagesByH$", () => {
    it("should call model correctly", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { imagesByH: {} } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let h: string = "h";

        apiV3.imagesByH$([h])
            .subscribe(
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
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let h: string = "h";

        apiV3.imagesByH$([h])
            .subscribe(
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
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let h: string = "h";

        apiV3.imagesByH$([h])
            .subscribe(
                (result: { [key: string]: { [index: string]: ICoreNode } }): void => {
                    expect(result).toBeDefined();
                    expect(result[h]).toBeDefined();

                    done();
                });
    });
});

describe("APIv3.sequenceByKey$", () => {
    it("should call model correctly", (done: Function) => {
        spyOn(console, "warn").and.stub();

        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: {} } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceByKey$([skey])
            .subscribe(
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
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "get").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceByKey$([skey])
            .subscribe(
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

        let skey: string = "skey";
        let nkey: string = "nkey";

        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: { skey: { key: skey, keys: [nkey] } } } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        apiV3.sequenceByKey$([skey])
            .subscribe(
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

        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceByKey$([skey])
            .subscribe(
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

        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve({ json: { sequenceByKey: {} } });
            },
        };

        let spy: jasmine.Spy = spyOn(model, "get");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceByKey$([skey])
            .subscribe(
                (result: { [key: string]: ISequence }): void => {
                    expect(result).toBeDefined();
                    expect(result[skey]).toBeDefined();
                    expect(result[skey].key).toBe(skey);
                    expect(result[skey].keys.length).toBe(0);

                    done();
                });
    });
});

describe("APIv3.imageViewAdd$", () => {
    it("should call model correctly", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let spy: jasmine.Spy = spyOn(model, "call");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageViewAdd$([key])
            .subscribe(
                (): void => {
                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(2);
                    expect(spy.calls.first().args[0].length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("imageViewAdd");
                    expect(spy.calls.first().args[1][0].length).toBe(1);
                    expect(spy.calls.first().args[1][0][0]).toBe(key);

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "call").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.imageViewAdd$([key])
            .subscribe(
                (): void => { return; },
                (error: Error): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(2);
                    expect(invalidateSpy.calls.first().args[0].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("imageViewAdd");
                    expect(invalidateSpy.calls.first().args[1][0].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[1][0][0]).toBe(key);

                    done();
                },
            );
    });
});

describe("APIv3.sequenceViewAdd$", () => {
    it("should call model correctly", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        let spy: jasmine.Spy = spyOn(model, "call");
        spy.and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceViewAdd$([skey])
            .subscribe(
                (): void => {
                    expect(spy.calls.count()).toBe(1);
                    expect(spy.calls.first().args.length).toBe(2);
                    expect(spy.calls.first().args[0].length).toBe(1);
                    expect(spy.calls.first().args[0][0]).toBe("sequenceViewAdd");
                    expect(spy.calls.first().args[1][0].length).toBe(1);
                    expect(spy.calls.first().args[1][0][0]).toBe(skey);

                    done();
                });
    });

    it("should invalidate model correctly when error is thrown", (done: Function) => {
        let model: falcor.Model = new falcor.Model();

        let promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                reject(new Error());
            },
        };

        let invalidateSpy: jasmine.Spy = spyOn(model, "invalidate");
        invalidateSpy.and.stub();

        spyOn(model, "call").and.returnValue(promise);

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let skey: string = "skey";

        apiV3.sequenceViewAdd$([skey])
            .subscribe(
                (): void => { return; },
                (error: Error): void => {
                    expect(invalidateSpy.calls.count()).toBe(1);
                    expect(invalidateSpy.calls.first().args.length).toBe(2);
                    expect(invalidateSpy.calls.first().args[0].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[0][0]).toBe("sequenceViewAdd");
                    expect(invalidateSpy.calls.first().args[1][0].length).toBe(1);
                    expect(invalidateSpy.calls.first().args[1][0][0]).toBe(skey);

                    done();
                },
            );
    });
});

describe("APIv3.invalidateImageByKey", () => {
    it("should call model correctly", () => {
        let model: falcor.Model = new falcor.Model();

        let spy: jasmine.Spy = spyOn(model, "invalidate");

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let key: string = "key";

        apiV3.invalidateImageByKey([key]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.first().args[0].length).toBe(2);
        expect(spy.calls.first().args[0][0]).toBe("imageByKey");
        expect(spy.calls.first().args[0][1].length).toBe(1);
        expect(spy.calls.first().args[0][1][0]).toBe(key);
    });
});

describe("APIv3.invalidateImagesByH", () => {
    it("should call model correctly", () => {
        let model: falcor.Model = new falcor.Model();

        let spy: jasmine.Spy = spyOn(model, "invalidate");

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let h: string = "h";

        apiV3.invalidateImagesByH([h]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.first().args[0].length).toBe(2);
        expect(spy.calls.first().args[0][0]).toBe("imagesByH");
        expect(spy.calls.first().args[0][1].length).toBe(1);
        expect(spy.calls.first().args[0][1][0]).toBe(h);
    });
});

describe("APIv3.invalidateSequenceByKey", () => {
    it("should call model correctly", () => {
        let model: falcor.Model = new falcor.Model();

        let spy: jasmine.Spy = spyOn(model, "invalidate");

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        let sKey: string = "sKey";

        apiV3.invalidateSequenceByKey([sKey]);

        expect(spy.calls.count()).toBe(1);
        expect(spy.calls.first().args[0].length).toBe(2);
        expect(spy.calls.first().args[0][0]).toBe("sequenceByKey");
        expect(spy.calls.first().args[0][1].length).toBe(1);
        expect(spy.calls.first().args[0][1][0]).toBe(sKey);
    });
});

describe("APIv3.setToken", () => {
    it("should invalidate old model and create a new with token", () => {
        let model: falcor.Model = new falcor.Model();

        let modelSpy: jasmine.Spy = spyOn(model, "invalidate");

        let creator: ModelCreator = new ModelCreator();
        let creatorSpy: jasmine.Spy = spyOn(creator, "createModel");
        creatorSpy.and.returnValue(model);

        let apiV3: APIv3 = new APIv3("clientId", undefined, creator);

        apiV3.setToken("token");

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
