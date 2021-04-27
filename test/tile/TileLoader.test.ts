import { Subject } from "rxjs";
import { APIWrapper } from "../../src/api/APIWrapper";
import { ImageTileEnt, ImageTilesContract } from "../../src/mapillary";
import { TileLoader } from "../../src/tile/TileLoader";
import { DataProvider } from "../helper/ProviderHelper";

describe("TileLoader.ctor", () => {
    test("should be contructed", () => {
        const provider = new DataProvider();
        const api = new APIWrapper(provider);
        const loader = new TileLoader(api);

        expect(loader).toBeDefined();
    });
});

describe("TileLoader.getURLs$", () => {
    test("should get level URLs", (done) => {
        const imageTileEnt: ImageTileEnt =
            { url: "test-url", x: 1, y: 2, z: 3 };
        const imageTileEnts = [imageTileEnt];
        const contract: ImageTilesContract = {
            node: imageTileEnts,
            node_id: "test-id",
        }
        const api = new APIWrapper(new DataProvider());
        const getImageTiles$ = new Subject<ImageTilesContract>();
        spyOn(api, "getImageTiles$").and.returnValue(getImageTiles$);

        const loader = new TileLoader(api);
        loader
            .getURLs$(contract.node_id, imageTileEnt.z)
            .subscribe(
                result => {
                    expect(result.length).toBe(1);
                    expect(result[0].url).toBe(imageTileEnt.url);
                    expect(result[0].x).toBe(imageTileEnt.x);
                    expect(result[0].y).toBe(imageTileEnt.y);
                    expect(result[0].z).toBe(imageTileEnt.z);
                    done();
                });

        getImageTiles$.next(contract);
    });

    test("should only invoke getImageTiles$ once", (done) => {
        const imageTileEnt: ImageTileEnt =
            { url: "test-url", x: 1, y: 2, z: 3 };
        const imageTileEnts = [imageTileEnt];
        const contract: ImageTilesContract = {
            node: imageTileEnts,
            node_id: "test-id",
        }
        const api = new APIWrapper(new DataProvider());
        const getImageTiles$ = new Subject<ImageTilesContract>();
        const spy = spyOn(api, "getImageTiles$")
            .and.returnValue(getImageTiles$);

        const loader = new TileLoader(api);

        let subscriptionEmits = 0;

        loader
            .getURLs$(contract.node_id, imageTileEnt.z)
            .subscribe(
                () => {
                    subscriptionEmits++;
                    if (subscriptionEmits === 2) {
                        expect(spy.calls.count()).toBe(1);
                        done();
                    }
                });
        loader
            .getURLs$(contract.node_id, imageTileEnt.z)
            .subscribe(
                () => {
                    subscriptionEmits++;
                    if (subscriptionEmits === 2) {
                        expect(spy.calls.count()).toBe(1);
                        done();
                    }
                });

        getImageTiles$.next(contract);
    });

    test("should clear and reinvoke on success", (done) => {
        const imageTileEnt: ImageTileEnt =
            { url: "test-url", x: 1, y: 2, z: 3 };
        const imageTileEnts = [imageTileEnt];
        const contract: ImageTilesContract = {
            node: imageTileEnts,
            node_id: "test-id",
        }
        const api = new APIWrapper(new DataProvider());
        const getImageTiles1$ = new Subject<ImageTilesContract>();
        const spy = spyOn(api, "getImageTiles$")
            .and.returnValue(getImageTiles1$);

        const loader = new TileLoader(api);

        let subscriptionEmits = 0;
        loader
            .getURLs$(contract.node_id, imageTileEnt.z)
            .subscribe(
                () => {
                    subscriptionEmits++;
                });
        getImageTiles1$.next(contract);
        getImageTiles1$.complete();

        const getImageTiles2$ = new Subject<ImageTilesContract>();
        spy.and.returnValue(getImageTiles2$);

        loader
            .getURLs$(contract.node_id, imageTileEnt.z)
            .subscribe(
                () => {
                    subscriptionEmits++;
                    expect(subscriptionEmits).toBe(2);
                    expect(spy.calls.count()).toBe(2);
                    done();
                });

        getImageTiles2$.next(contract);
        getImageTiles2$.complete();
    });

    test("should clear and reinvoke on error", (done) => {
        const api = new APIWrapper(new DataProvider());
        const getImageTiles1$ = new Subject<ImageTilesContract>();
        const spy = spyOn(api, "getImageTiles$")
            .and.returnValue(getImageTiles1$);

        const loader = new TileLoader(api);

        const imageId = "test-id";
        const level = 11;
        let errorCount = 0;
        loader
            .getURLs$(imageId, level)
            .subscribe(
                () => { /* noop */ },
                () => errorCount++);
        getImageTiles1$.error(new Error());
        getImageTiles1$.complete();

        const getImageTiles2$ = new Subject<ImageTilesContract>();
        spy.and.returnValue(getImageTiles2$);

        loader
            .getURLs$(imageId, level)
            .subscribe(
                () => { /* noop */ },
                () => {
                    errorCount++;
                    expect(errorCount).toBe(2);
                    expect(spy.calls.count()).toBe(2);
                    done();
                });

        getImageTiles2$.error(new Error());
        getImageTiles2$.complete();
    });

    test("should make different requests for different levels", () => {
        const api = new APIWrapper(new DataProvider());
        const getImageTiles$ = new Subject<ImageTilesContract>();
        const spy = spyOn(api, "getImageTiles$")
            .and.returnValue(getImageTiles$);

        const loader = new TileLoader(api);

        const imageId = "test-id";
        loader
            .getURLs$(imageId, 1)
            .subscribe();

        loader
            .getURLs$(imageId, 2)
            .subscribe();

        expect(spy.calls.count()).toBe(2);
    });
});
