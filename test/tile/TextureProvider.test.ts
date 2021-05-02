import * as THREE from "three";
import {
    empty as observableEmpty,
    Subject,
} from "rxjs";

import { TextureProvider } from "../../src/tile/TextureProvider";
import { TileLoader } from "../../src/tile/TileLoader";
import { TileStore } from "../../src/tile/TileStore";
import {
    TILE_MIN_REQUEST_LEVEL,
    TILE_SIZE,
} from "../../src/tile/interfaces/TileTypes";
import { TileRegionOfInterest }
    from "../../src/tile/interfaces/TileRegionOfInterest";

import { MockCreator } from "../helper/MockCreator";
import { RendererMock } from "../helper/WebGLRenderer";
import { ImageTileEnt } from "../../src/api/ents/ImageTileEnt";

const mockCreator = new MockCreator();

describe("TextureProvider.ctor", () => {
    test("should be contructed", () => {
        spyOn(console, "warn").and.stub();

        const store = mockCreator.create(TileStore, "TileStore");
        const loader = mockCreator.create(TileLoader, "TileLoader");
        (<jasmine.Spy>loader.getImage$)
            .and.returnValue([
                observableEmpty(),
                (): void => { /* noop */ },
            ]);

        const renderer = <THREE.WebGLRenderer><unknown>new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(renderer);

        const textureProvider =
            new TextureProvider(
                "",
                1,
                1,
                new Image(),
                loader,
                store,
                renderer);

        expect(textureProvider).toBeDefined();
    });
});

describe("TextureProvider.setRegionOfInterest", () => {
    beforeEach(() => {
        spyOn(console, "warn").and.stub();
    });

    let store: TileStore = undefined;
    let getURLSpy: jasmine.Spy = undefined;
    let loader: TileLoader = undefined;
    let getImageSpy: jasmine.Spy = undefined;
    let getURLsSpy: jasmine.Spy = undefined;
    let renderer: THREE.WebGLRenderer = undefined;

    beforeEach(() => {
        loader = mockCreator.create(TileLoader, "TileLoader");
        getURLsSpy = <jasmine.Spy>loader.getURLs$;
        getImageSpy = <jasmine.Spy>loader.getImage$;
        getImageSpy.and.returnValue([
            observableEmpty(),
            (): void => { /* noop */ },
        ]);

        store = mockCreator.create(TileStore, "TileStore");
        getURLSpy = <jasmine.Spy>store.getURL;

        renderer = <THREE.WebGLRenderer><unknown>new RendererMock();
        spyOn(renderer, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{
                getParameter: () => {
                    return 2048;
                }
            });
        spyOn(THREE, "WebGLRenderer").and.returnValue(renderer);
    })

    test("should request one tile", () => {
        const width = TILE_SIZE + 1;
        const height = TILE_SIZE;

        const getURLs = new Subject<ImageTileEnt[]>();
        getURLsSpy.and.returnValue(getURLs);

        const imageId = "image-id";
        const textureProvider =
            new TextureProvider(
                imageId,
                width,
                height,
                new Image(),
                loader,
                store,
                renderer);

        const roi: TileRegionOfInterest = {
            bbox: { maxX: 0.75, maxY: 0.75, minX: 0.25, minY: 0.25 },
            pixelHeight: 1 / height,
            pixelWidth: 1 / width,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getURLsSpy.calls.count()).toBe(1);
        const getURLsCI = getURLsSpy.calls.first();
        expect(getURLsCI.args.length).toBe(2);
        expect(getURLsCI.args[0]).toBe(imageId);
        expect(getURLsCI.args[1]).toBe(TILE_MIN_REQUEST_LEVEL);

        expect(getImageSpy.calls.count()).toBe(0);

        const url = "url";
        getURLSpy.and.returnValue(url);

        const ent: ImageTileEnt = { url, x: 0, y: 0, z: 11 };
        getURLs.next([ent]);
        getURLs.complete();

        expect(getImageSpy.calls.count()).toBe(1);
        const getImageCI = getImageSpy.calls.first();
        expect(getImageCI.args.length).toBe(1);
        expect(getImageCI.args[0]).toBe(ent.url);
    });

    test("should clamp when lower than min request level", () => {
        const width = 2 * TILE_SIZE;
        const height = 2 * TILE_SIZE;

        const getURLs = new Subject<ImageTileEnt[]>();
        getURLsSpy.and.returnValue(getURLs);

        const imageId = "image-id";
        const textureProvider =
            new TextureProvider(
                imageId,
                width,
                height,
                new Image(),
                loader,
                store,
                renderer);

        const roi: TileRegionOfInterest = {
            bbox: { maxX: 0.75, maxY: 0.75, minX: 0.25, minY: 0.25 },
            pixelHeight: 1,
            pixelWidth: 1,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getURLsSpy.calls.count()).toBe(1);
        const getURLsCI = getURLsSpy.calls.first();
        expect(getURLsCI.args.length).toBe(2);
        expect(getURLsCI.args[0]).toBe(imageId);
        expect(getURLsCI.args[1]).toBe(TILE_MIN_REQUEST_LEVEL);
    });

    test("should request multiple tiles in x direction", () => {
        const width = 2 * TILE_SIZE;
        const height = 2 * TILE_SIZE;

        const getURLs = new Subject<ImageTileEnt[]>();
        getURLsSpy.and.returnValue(getURLs);

        const imageId = "image-id";
        const textureProvider =
            new TextureProvider(
                imageId,
                width,
                height,
                new Image(),
                loader,
                store,
                renderer);

        const roi: TileRegionOfInterest = {
            bbox: { maxX: 0.75, maxY: 0.25, minX: 0.25, minY: 0 },
            pixelHeight: 1 / width,
            pixelWidth: 1 / height,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getURLsSpy.calls.count()).toBe(1);
        const getURLsCI = getURLsSpy.calls.first();
        expect(getURLsCI.args.length).toBe(2);
        expect(getURLsCI.args[0]).toBe(imageId);
        expect(getURLsCI.args[1]).toBe(TILE_MIN_REQUEST_LEVEL);

        expect(getImageSpy.calls.count()).toBe(0);

        let first = true;
        getURLSpy.and.callFake(() => {
            if (first) { first = false; return "url-1"; }
            return "url-2";
        });

        const ent1: ImageTileEnt = { url: "url-1", x: 0, y: 0, z: 11 };
        const ent2: ImageTileEnt = { url: "url-2", x: 1, y: 0, z: 11 };
        getURLs.next([ent1, ent2]);
        getURLs.complete();

        expect(getImageSpy.calls.count()).toBe(2);
        const args1 = getImageSpy.calls.argsFor(0);
        expect(args1.length).toBe(1);
        expect(args1[0]).toBe(ent1.url);

        const args2 = getImageSpy.calls.argsFor(1);
        expect(args2.length).toBe(1);
        expect(args2[0]).toBe(ent2.url);
    });

    test("should request multiple tiles in y direction", () => {
        const width = 2 * TILE_SIZE;
        const height = 2 * TILE_SIZE;

        const getURLs = new Subject<ImageTileEnt[]>();
        getURLsSpy.and.returnValue(getURLs);

        const imageId = "image-id";
        const textureProvider =
            new TextureProvider(
                imageId,
                width,
                height,
                new Image(),
                loader,
                store,
                renderer);

        const roi: TileRegionOfInterest = {
            bbox: { maxX: 0.25, maxY: 0.75, minX: 0, minY: 0.25 },
            pixelHeight: 1 / width,
            pixelWidth: 1 / height,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getURLsSpy.calls.count()).toBe(1);
        const getURLsCI = getURLsSpy.calls.first();
        expect(getURLsCI.args.length).toBe(2);
        expect(getURLsCI.args[0]).toBe(imageId);
        expect(getURLsCI.args[1]).toBe(TILE_MIN_REQUEST_LEVEL);

        expect(getImageSpy.calls.count()).toBe(0);

        let first = true;
        getURLSpy.and.callFake(() => {
            if (first) { first = false; return "url-1"; }
            return "url-2";
        });

        const ent1: ImageTileEnt = { url: "url-1", x: 0, y: 0, z: 11 };
        const ent2: ImageTileEnt = { url: "url-2", x: 0, y: 1, z: 11 };
        getURLs.next([ent1, ent2]);
        getURLs.complete();

        expect(getImageSpy.calls.count()).toBe(2);
        const args1 = getImageSpy.calls.argsFor(0);
        expect(args1.length).toBe(1);
        expect(args1[0]).toBe(ent1.url);

        const args2 = getImageSpy.calls.argsFor(1);
        expect(args2.length).toBe(1);
        expect(args2[0]).toBe(ent2.url);
    });
});
