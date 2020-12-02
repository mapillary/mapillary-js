import DataProviderBase from "../../src/api/DataProviderBase";
import MapillaryError from "../../src/error/MapillaryError";
import GeometryProviderBase from "../../src/api/GeometryProviderBase";
import IGeometryProvider from "../../src/api/interfaces/IGeometryProvider";
import BufferFetcher from "../../src/api/BufferFetcher";

describe("DataProviderBase.ctor", () => {
    it("should create a data provider base", () => {
        const geometry: IGeometryProvider = new GeometryProviderBase();
        const provider: DataProviderBase = new DataProviderBase(geometry);

        expect(provider).toBeDefined();
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

class DataProvider extends DataProviderBase {
    constructor() { super(new GeometryProviderBase()); }
    public getArrayBuffer(abort?: Promise<void>): Promise<ArrayBuffer> {
        return BufferFetcher.getArrayBuffer("", abort);
    }
}

describe("DataProviderBase.getArrayBuffer", () => {
    it(
        "should resolve array buffer with undefined abort parameter",
        (done: Function) => {

            const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
            spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

            const provider: DataProvider = new DataProvider();

            const response: ArrayBuffer = new ArrayBuffer(1024);

            provider.getArrayBuffer(undefined)
                .then(
                    (buffer: ArrayBuffer): void => {
                        expect(buffer instanceof ArrayBuffer).toBeTrue();
                        expect(buffer).toEqual(response);
                        done();
                    });

            requestMock.status = 200;
            requestMock.response = response;
            requestMock.onload(undefined);
        });

    it(
        "should resolve array buffer with defined abort parameter",
        (done: Function) => {

            const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
            spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

            const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
            const provider: DataProvider = new DataProvider();
            const response: ArrayBuffer = new ArrayBuffer(1024);

            provider.getArrayBuffer(abort)
                .then(
                    (buffer: ArrayBuffer): void => {
                        expect(buffer instanceof ArrayBuffer).toBeTrue();
                        expect(buffer).toEqual(response);
                        done();
                    });

            requestMock.status = 200;
            requestMock.response = response;
            requestMock.onload(undefined);
        });

    it("should reject with abort", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });

        const provider: DataProvider = new DataProvider();

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBeTrue();
                    expect(reason.message).toContain("abort");

                    done();
                });

        aborter();
    });

    it("should reject with status", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBeTrue();
                    expect(reason.message).toContain("status");

                    done();
                });

        requestMock.status = 404;
        requestMock.response = response;
        requestMock.onload(undefined);
    });

    it("should reject with empty", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBeTrue();
                    expect(reason.message).toContain("empty");

                    done();
                });

        requestMock.status = 200;
        requestMock.response = undefined;
        requestMock.onload(undefined);
    });

    it("should reject with error", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBeTrue();
                    expect(reason.message).toContain("error");

                    done();
                });

        requestMock.onerror(undefined);
    });

    it("should reject with timeout", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBeTrue();
                    expect(reason.message).toContain("timeout");

                    done();
                });

        requestMock.ontimeout(undefined);
    });
});
