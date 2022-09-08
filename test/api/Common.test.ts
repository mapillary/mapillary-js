import * as pako from "pako";
import { decompress, xhrFetch } from "../../src/api/Common";
import { IDEnt } from "../../src/api/ents/IDEnt";
import { GraphClusterContract } from "../../src/api/provider/GraphContracts";
import { MapillaryError } from "../../src/error/MapillaryError";
import { XMLHTTPRequestMock } from "../helper/RequestHelper";

describe("decompress", () => {
    test("should decompress cluster reconstruction", () => {

        const deflated = pako.deflate(
            JSON.stringify([{
                points: {},
                reference_lla: { altitude: 1, latitude: 2, longitude: 3 },
            }]));

        const clusters = decompress<GraphClusterContract[]>(deflated.buffer);

        expect(clusters.length).toBe(1);

        const decompressed = clusters[0];
        expect(decompressed.points).toEqual({});
        expect(decompressed.reference_lla.altitude).toBe(1);
        expect(decompressed.reference_lla.latitude).toBe(2);
        expect(decompressed.reference_lla.longitude).toBe(3);
    });
});

describe("xhrFetch", () => {
    it("should resolve array buffer", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });

        const response = new ArrayBuffer(1024);

        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .then(
                (buffer: ArrayBuffer): void => {
                    expect(buffer).toBeInstanceOf(ArrayBuffer);
                    expect(buffer.byteLength).toBe(1024);
                    expect(buffer).toBe(response);

                    done();
                });


        xhrMock.status = 200;
        xhrMock.response = response;
        xhrMock.onload(undefined);
    });

    it("should resolve json", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });

        const response: IDEnt = { id: "id" };

        xhrFetch<IDEnt>("url", "GET", "json", [], null, abort)
            .then(
                (ent: IDEnt): void => {
                    expect(ent.id).toBe("id");

                    done();
                });


        xhrMock.status = 200;
        xhrMock.response = response;
        xhrMock.onload(undefined);
    });

    it("should cancel", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        let rejecter: () => void;
        const abort: Promise<void> = new Promise((_, reject): void => {
            rejecter = reject;
        });

        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .catch(
                (error): void => {
                    expect(error).toBeInstanceOf(MapillaryError);

                    done();
                });

        rejecter();
    });

    it("should timeout", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort = new Promise<void>((_, __): void => { /*noop*/ });
        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .catch(
                (error): void => {
                    expect(error).toBeInstanceOf(MapillaryError);

                    done();
                });

        xhrMock.ontimeout(new ProgressEvent('timeout'));
    });

    it("should error", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort = new Promise<void>((_, __): void => { /*noop*/ });
        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .catch(
                (error): void => {
                    expect(error).toBeInstanceOf(MapillaryError);

                    done();
                });

        xhrMock.onerror(new ProgressEvent('timeout'));
    });

    it("should reject non-OK status", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });

        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .catch(
                (error): void => {
                    expect(error).toBeInstanceOf(MapillaryError);

                    done();
                });

        xhrMock.status = 404;
        xhrMock.onload(undefined);
    });

    it("should reject missing response", (done: Function) => {
        const xhrMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(xhrMock);

        const abort: Promise<void> = new Promise((_, __): void => { /*noop*/ });

        xhrFetch("url", "GET", "arraybuffer", [], null, abort)
            .catch(
                (error): void => {
                    expect(error).toBeInstanceOf(MapillaryError);

                    done();
                });

        xhrMock.status = 200;
        xhrMock.response = null;
        xhrMock.onload(undefined);
    });
});
