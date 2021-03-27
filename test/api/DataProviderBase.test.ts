import { fetchArrayBuffer } from "../../src/api/Common";
import { DataProviderBase } from "../../src/api/DataProviderBase";
import { MapillaryError } from "../../src/error/MapillaryError";
import { GeometryProvider } from "../helper/ProviderHelper";

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

export class DataProvider extends DataProviderBase {
    constructor() { super(new GeometryProvider()); }
    public getArrayBuffer(abort?: Promise<void>): Promise<ArrayBuffer> {
        return fetchArrayBuffer("", abort);
    }
}

describe("DataProviderBase.ctor", () => {
    test("should create a data provider base", () => {
        const provider = new DataProvider();

        expect(provider).toBeDefined();
        expect(provider).toBeInstanceOf(DataProvider);
        expect(provider).toBeInstanceOf(DataProviderBase);
    });
});

describe("DataProviderBase.getArrayBuffer", () => {
    test(
        "should resolve array buffer with undefined abort parameter",
        (done: Function) => {

            const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
            spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

            const provider: DataProvider = new DataProvider();

            const response: ArrayBuffer = new ArrayBuffer(1024);

            provider.getArrayBuffer(undefined)
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

    test(
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
                        expect(buffer instanceof ArrayBuffer).toBe(true);
                        expect(buffer).toEqual(response);
                        done();
                    });

            requestMock.status = 200;
            requestMock.response = response;
            requestMock.onload(undefined);
        });

    test("should reject with abort", (done: Function) => {
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
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("abort");

                    done();
                });

        aborter();
    });

    test("should reject with status", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
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

    test("should reject with empty", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
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

    test("should reject with error", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("error");

                    done();
                });

        requestMock.onerror(undefined);
    });

    test("should reject with timeout", (done: Function) => {
        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });
        const provider: DataProvider = new DataProvider();

        const response: ArrayBuffer = new ArrayBuffer(1024);

        provider.getArrayBuffer(abort)
            .then(
                undefined,
                (reason: Error): void => {
                    expect(reason instanceof MapillaryError).toBe(true);
                    expect(reason.message).toContain("timeout");

                    done();
                });

        requestMock.ontimeout(undefined);
    });
});
