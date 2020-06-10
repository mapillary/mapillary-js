import {empty as observableEmpty, Observable} from "rxjs";
import * as THREE from "three";

import {MockCreator} from "../helper/MockCreator.spec";

import {
    ImageTileLoader,
    ImageTileStore,
    IRegionOfInterest,
    TextureProvider,
} from "../../src/Tiles";

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public getContext(): void { return; }
    public render(s: THREE.Scene, c: THREE.Camera, t?: THREE.WebGLRenderTarget): void { return; }
    public getRenderTarget(): THREE.RenderTarget { return; }
    public setRenderTarget(t?: THREE.WebGLRenderTarget): void { return; }
    public setSize(w: number, h: number, updateStyle?: boolean): void { return; }
}

describe("TextureProvider.ctor", () => {
    it("should be contructed", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        (<jasmine.Spy>imageTileLoader.getTile).and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                1,
                1,
                1,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        expect(textureProvider).toBeDefined();
    });
});

describe("TextureProvider.setRegionOfInterest", () => {
    it("should request one tile for the whole image with original size when resolution is the same as the image size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = tileSize;
        let height: number = tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 0, maxY: 0, minX: 0, minY: 0},
            pixelHeight: 1 / height,
            pixelWidth: 1 / width,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width);
        expect(callInfo.args[6]).toBe(height);
    });

    it("should request one tile for the whole image with original size when resolution higher than image size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = tileSize;
        let height: number = tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 0},
            pixelHeight: 1 / height / 4,
            pixelWidth: 1 / width / 4,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width);
        expect(callInfo.args[6]).toBe(height);
    });

    it("should request one tile for the whole image with scaled size when resolution is lower than image size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = tileSize;
        let height: number = tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 0},
            pixelHeight: 2 / height,
            pixelWidth: 2 / width,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width / 2);
        expect(callInfo.args[6]).toBe(height / 2);
    });

    it("should request one tile for the whole image with scaled size 1 x 1 when image is contained in one screen pixel", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = tileSize;
        let height: number = tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 0},
            pixelHeight: 2,
            pixelWidth: 2,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(1);
        expect(callInfo.args[6]).toBe(1);
    });

    it("should request one tile with correct size when image width is larger than tile size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 512 + 100;
        let height: number = 512;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 1, minY: 0},
            pixelHeight: 1 / height / 2,
            pixelWidth: 1 / width / 2,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(tileSize);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width - tileSize);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width - tileSize);
        expect(callInfo.args[6]).toBe(height);
    });

    it("should request one tile with correct size when image width is larger than tile size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 512;
        let height: number = 512 + 200;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 1},
            pixelHeight: 1 / height / 2,
            pixelWidth: 1 / width / 2,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(tileSize);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height - tileSize);
        expect(callInfo.args[5]).toBe(width);
        expect(callInfo.args[6]).toBe(height - tileSize);
    });

    it("should request one tile with correct size when image width is larger than tile size", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 512 + 16;
        let height: number = 512 + 16;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 1, minY: 1},
            pixelHeight: 1 / height / 2,
            pixelWidth: 1 / width / 2,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(tileSize);
        expect(callInfo.args[2]).toBe(tileSize);
        expect(callInfo.args[3]).toBe(width - tileSize);
        expect(callInfo.args[4]).toBe(height - tileSize);
        expect(callInfo.args[5]).toBe(width - tileSize);
        expect(callInfo.args[6]).toBe(height - tileSize);
    });

    it("should request correct width and height and not scale image when image aspect ratio is not square", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 488;
        let height: number = 324;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 0},
            pixelHeight: 1 / tileSize,
            pixelWidth: 1 / tileSize,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width);
        expect(callInfo.args[6]).toBe(height);
    });

    it("should request correct width and height and scale image when image aspect ratio is not square", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 488;
        let height: number = 324;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 1, maxY: 1, minX: 0, minY: 0},
            pixelHeight: 2 / tileSize,
            pixelWidth: 2 / tileSize,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(1);

        let callInfo: jasmine.CallInfo<jasmine.Func> = getTileSpy.calls.first();

        expect(callInfo.args.length).toBe(7);

        expect(callInfo.args[1]).toBe(0);
        expect(callInfo.args[2]).toBe(0);
        expect(callInfo.args[3]).toBe(width);
        expect(callInfo.args[4]).toBe(height);
        expect(callInfo.args[5]).toBe(width / 2);
        expect(callInfo.args[6]).toBe(height / 2);
    });

    it("should request multiple tiles in x direction", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 2 * tileSize;
        let height: number = 2 * tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 0.75, maxY: 0.25, minX: 0.25, minY: 0},
            pixelHeight: 1 / width,
            pixelWidth: 1 / height,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(2);

        let args1: any[] = getTileSpy.calls.argsFor(0);

        expect(args1.length).toBe(7);
        expect(args1[1]).toBe(0);
        expect(args1[2]).toBe(0);
        expect(args1[3]).toBe(tileSize);
        expect(args1[4]).toBe(tileSize);
        expect(args1[5]).toBe(tileSize);
        expect(args1[6]).toBe(tileSize);

        let args2: any[] = getTileSpy.calls.argsFor(1);

        expect(args2.length).toBe(7);
        expect(args2[1]).toBe(tileSize);
        expect(args2[2]).toBe(0);
        expect(args2[3]).toBe(tileSize);
        expect(args2[4]).toBe(tileSize);
        expect(args2[5]).toBe(tileSize);
        expect(args2[6]).toBe(tileSize);
    });

    it("should request multiple tiles in y direction", () => {
        spyOn(console, "warn").and.stub();

        let imageTileLoader: ImageTileLoader = new MockCreator().create(ImageTileLoader, "ImageTileLoader");
        let getTileSpy: jasmine.Spy = <jasmine.Spy>imageTileLoader.getTile;
        getTileSpy.and.returnValue([observableEmpty(), (): void => { return; }]);

        let imageTileStore: ImageTileStore = new MockCreator().create(ImageTileStore, "ImageTileStore");

        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(rendererMock, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => { return 1024; } });

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let tileSize: number = 512;
        let width: number = 2 * tileSize;
        let height: number = 2 * tileSize;

        let textureProvider: TextureProvider =
            new TextureProvider(
                "",
                width,
                height,
                tileSize,
                new Image(),
                imageTileLoader,
                imageTileStore,
                rendererMock);

        let roi: IRegionOfInterest = {
            bbox: { maxX: 0.25, maxY: 0.75, minX: 0, minY: 0.25 },
            pixelHeight: 1 / width,
            pixelWidth: 1 / height,
        };

        textureProvider.setRegionOfInterest(roi);

        expect(getTileSpy.calls.count()).toBe(2);

        let args1: any[] = getTileSpy.calls.argsFor(0);

        expect(args1.length).toBe(7);
        expect(args1[1]).toBe(0);
        expect(args1[2]).toBe(0);
        expect(args1[3]).toBe(tileSize);
        expect(args1[4]).toBe(tileSize);
        expect(args1[5]).toBe(tileSize);
        expect(args1[6]).toBe(tileSize);

        let args2: any[] = getTileSpy.calls.argsFor(1);

        expect(args2.length).toBe(7);
        expect(args2[1]).toBe(0);
        expect(args2[2]).toBe(tileSize);
        expect(args2[3]).toBe(tileSize);
        expect(args2[4]).toBe(tileSize);
        expect(args2[5]).toBe(tileSize);
        expect(args2[6]).toBe(tileSize);
    });
});
