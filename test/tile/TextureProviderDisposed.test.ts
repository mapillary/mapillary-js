import * as THREE from "three";
import { Subject } from "rxjs";

import { TextureProvider } from "../../src/tile/TextureProvider";
import { TileLoader } from "../../src/tile/TileLoader";
import { TileStore } from "../../src/tile/TileStore";
import { TILE_SIZE } from "../../src/tile/interfaces/TileTypes";
import { ImageTileEnt } from "../../src/api/ents/ImageTileEnt";
import { MockCreator } from "../helper/MockCreator";
import { RendererMock } from "../helper/WebGLRenderer";

describe("TextureProvider after dispose", () => {
    function fixture(): any {
        spyOn(console, "warn").and.stub();
        const mockCreator = new MockCreator();
        const loader = mockCreator.create(TileLoader, "TileLoader");
        const store = mockCreator.create(TileStore, "TileStore");
        const renderer = <THREE.WebGLRenderer><unknown>new RendererMock();
        spyOn(renderer, "getContext").and.returnValue(
            <WebGLRenderingContext><unknown>{ getParameter: () => 2048 });
        const width = TILE_SIZE + 1;
        const height = TILE_SIZE;
        const provider = new TextureProvider("image-id", width, height, new Image(), loader, store, renderer);
        const roi = {
            bbox: { maxX: 0.75, maxY: 0.75, minX: 0.25, minY: 0.25 },
            pixelHeight: 1 / height,
            pixelWidth: 1 / width,
        };
        return { loader, store, provider, roi };
    }

    it("ignores region of interest updates", () => {
        const f = fixture();
        f.provider.dispose();
        f.provider.setRegionOfInterest(f.roi);
        expect(<jasmine.Spy>f.loader.getURLs$).not.toHaveBeenCalled();
    });

    it("never renders a tile that arrives after dispose", () => {
        const f = fixture();
        const urls = new Subject<ImageTileEnt[]>();
        const image = new Subject<HTMLImageElement>();
        (<jasmine.Spy>f.loader.getURLs$).and.returnValue(urls);
        (<jasmine.Spy>f.loader.getImage$).and.returnValue([image, (): void => { /* noop */ }]);
        (<jasmine.Spy>f.store.getURL).and.returnValue("url");
        f.provider.setRegionOfInterest(f.roi);
        urls.next([{ url: "url", x: 0, y: 0, z: 11 }]);
        f.provider.dispose();
        expect(() => image.next(new Image())).not.toThrow();
        expect(<jasmine.Spy>f.store.add).not.toHaveBeenCalled();
    });
});
