import { ImageHelper } from "../helper/ImageHelper";
import { Image as MImage } from "../../src/graph/Image";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { MeshContract } from "../../src/api/contracts/MeshContract";
import { ImageCache } from "../../src/graph/ImageCache";
import { PerspectiveCamera } from "../../src/geometry/camera/PerspectiveCamera";
import { ICamera } from "../../src/geometry/interfaces/ICamera";

describe("Image", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should create a image", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        expect(image).toBeDefined();
    });
});

describe("Image.complete", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should make image complete", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        expect(image.complete).toBe(false);

        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();

        image.makeComplete(fillImage);

        expect(image.complete).toBe(true);
    });

    it("should throw when fill is null", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        expect(() => { image.makeComplete(null); }).toThrowError(Error);
    });
});

describe("Image.dispose", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should clear core and fill properties", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(fillImage);

        image.dispose();

        expect(image.complete).toBe(false);

        expect(() => { return image.id; }).toThrowError(Error);
    });

    it("should dipose cache", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let imageCache: ImageCache = new ImageCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(imageCache, "dispose");
        disposeSpy.and.stub();

        image.initializeCache(imageCache);

        image.dispose();

        expect(disposeSpy.calls.count()).toBe(1);
    });
});

describe("Image.uncache", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should handle when cache is not initilized", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        image.uncache();
    });

    it("should dispose image cache", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let imageCache: ImageCache = new ImageCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(imageCache, "dispose");
        disposeSpy.and.stub();

        image.initializeCache(imageCache);

        image.uncache();

        expect(disposeSpy.calls.count()).toBe(1);
    });

    it("should be able to initialize cache again after uncache", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let imageCache: ImageCache = new ImageCache(undefined);

        let disposeSpy: jasmine.Spy = spyOn(imageCache, "dispose");
        disposeSpy.and.stub();

        image.initializeCache(imageCache);

        image.uncache();

        image.initializeCache(imageCache);
    });
});

describe("Image.merged", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should not be merged when not complete", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        expect(image.merged).toBe(false);
    });

    it("should not be merged because merge cc is null", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage.merge_id = null;

        image.makeComplete(fillImage);

        expect(image.merged).toBe(false);
    });

    it("should be merged because merge cc present", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();

        fillImage.merge_id = "7";

        image.makeComplete(fillImage);

        expect(image.merged).toBe(true);
    });
});

describe("Image.assetsCached", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should not be cached when core", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);

        expect(image.assetsCached).toBe(false);
    });

    class ImageCacheMock extends ImageCache {
        protected _overridingImage: HTMLImageElement;
        protected _overridingMesh: MeshContract;
        protected _overridingCamera: ICamera;

        constructor() { super(undefined); }

        public get image(): HTMLImageElement {
            return this._overridingImage;
        }

        public set image(value: HTMLImageElement) {
            this._overridingImage = value;
        }

        public get mesh(): MeshContract {
            return this._overridingMesh;
        }

        public set mesh(value: MeshContract) {
            this._overridingMesh = value;
        }

        public get camera(): ICamera {
            return this._overridingCamera;
        }

        public set camera(value: ICamera) {
            this._overridingCamera = value;
        }
    }

    it("should be cached when assets set", () => {
        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        let image = new MImage(coreImage);
        let fillImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(fillImage);

        let imageCache: ImageCacheMock = new ImageCacheMock();
        imageCache.image = new Image();
        imageCache.mesh = { faces: [], vertices: [] };
        imageCache.camera = new PerspectiveCamera([1, 0, 0]);

        image.initializeCache(imageCache);

        expect(image.assetsCached).toBe(true);
    });
});
