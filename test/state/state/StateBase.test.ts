import { ImageHelper } from "../../helper/ImageHelper";

import { Image } from "../../../src/graph/Image";
import { CoreImageEnt } from "../../../src/api/ents/CoreImageEnt";
import { ImageEnt } from "../../../src/api/ents/ImageEnt";
import { EulerRotation } from "../../../src/state/interfaces/EulerRotation";
import { IStateBase } from "../../../src/state/interfaces/IStateBase";
import { StateBase } from "../../../src/state/state/StateBase";
import { Camera } from "../../../src/geo/Camera";
import { TransitionMode } from "../../../src/state/TransitionMode";
import { ProjectionService } from "../../../src/viewer/ProjectionService";
import { ImageCache } from "../../../src/graph/ImageCache";
import { DataProvider } from "../../helper/ProviderHelper";
import { TestImage } from "../../helper/TestImage";

class TestStateBase extends StateBase {
    public traverse(): StateBase { return null; }
    public wait(): StateBase { return null; }
    public waitInteractively(): StateBase { return null; }
    public move(delta: number): void { return; }
    public moveTo(position: number): void { return; }
    public rotate(delta: EulerRotation): void { return; }
    public rotateUnbounded(delta: EulerRotation): void { return; }
    public rotateWithoutInertia(delta: EulerRotation): void { return; }
    public rotateBasic(basicRotation: number[]): void { return; }
    public rotateBasicUnbounded(basic: number[]): void { return; }
    public rotateBasicWithoutInertia(basic: number[]): void { return; }
    public rotateToBasic(basic: number[]): void { return; }
    public zoomIn(delta: number, reference: number[]): void { return; }
    public update(delta: number): void { return; }
    public setCenter(center: number[]): void { return; }
    public setZoom(zoom: number): void { return; }
    public setSpeed(speed: number): void { return; }

    public motionlessTransition(): boolean { return this._motionlessTransition(); }

    protected _getAlpha(): number { return; }
}

let createState: () => IStateBase = (): IStateBase => {
    return {
        alpha: 1,
        camera: new Camera(),
        currentIndex: -1,
        reference: { alt: 0, lat: 0, lng: 0 },
        trajectory: [],
        transitionMode: TransitionMode.Default,
        zoom: 0,
    };
};

let createCompleteImage: () => Image = (): Image => {
    let helper: ImageHelper = new ImageHelper();
    let image = new TestImage(helper.createCoreImageEnt());
    image.makeComplete(helper.createSpatialImageEnt());
    image.initializeCache(new ImageCache(new DataProvider()));
    image.cacheCamera(new ProjectionService());

    return image;
};

describe("StateBase.transitionMode", () => {
    it("should set transition mode", () => {
        const state1: IStateBase = createState();
        const stateBase1: TestStateBase = new TestStateBase(state1);

        expect(stateBase1.transitionMode).toBe(TransitionMode.Default);

        const state2: IStateBase = createState();
        state2.transitionMode = TransitionMode.Instantaneous;
        const stateBase2: TestStateBase = new TestStateBase(state2);

        expect(stateBase2.transitionMode).toBe(TransitionMode.Instantaneous);
    });
});

describe("StateBase.motionlessTransition", () => {
    it("should be false if not both images set", () => {
        const state: IStateBase = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        expect(stateBase.motionlessTransition()).toBe(false);
    });

    it("should be false if images has structure", () => {
        const state: IStateBase = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: ImageHelper = new ImageHelper();

        const imageEnt1: ImageEnt = helper.createImageEnt();
        imageEnt1.merge_id = "1";
        const image1 = new TestImage(imageEnt1);
        image1.makeComplete(imageEnt1);
        image1.initializeCache(new ImageCache(new DataProvider()));
        image1.cacheCamera(new ProjectionService());
        image1.mesh = {
            vertices: [0, 0, 0, 1, 1, 1, 2, 2, 2],
            faces: [0, 1, 2],
        };

        const imageEnt2: ImageEnt = helper.createImageEnt();
        imageEnt2.merge_id = "1";
        const image2 = new TestImage(imageEnt2);
        image2.makeComplete(imageEnt2);
        image2.initializeCache(new ImageCache(new DataProvider()));
        image2.cacheCamera(new ProjectionService());
        image2.mesh = {
            vertices: [0, 0, 0, 1, 1, 1, 2, 2, 2],
            faces: [0, 1, 2],
        };

        stateBase.set([image1]);
        stateBase.set([image2]);

        expect(stateBase.motionlessTransition()).toBe(false);
    });

    it("should be true if only previous image has structure", () => {
        const state: IStateBase = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: ImageHelper = new ImageHelper();

        const imageEnt1: ImageEnt = helper.createImageEnt();
        imageEnt1.merge_id = "1";
        const image1 = new TestImage(imageEnt1);
        image1.makeComplete(imageEnt1);
        image1.initializeCache(new ImageCache(new DataProvider()));
        image1.cacheCamera(new ProjectionService());
        image1.mesh = {
            vertices: [0, 0, 0, 1, 1, 1, 2, 2, 2],
            faces: [0, 1, 2],
        };

        const imageEnt2: ImageEnt = helper.createImageEnt();
        imageEnt2.merge_id = "1";
        const image2 = new TestImage(imageEnt2);
        image2.makeComplete(imageEnt2);
        image2.initializeCache(new ImageCache(new DataProvider()));
        image2.cacheCamera(new ProjectionService());
        image2.mesh = {
            vertices: [],
            faces: [],
        };

        stateBase.set([image1]);
        stateBase.set([image2]);

        expect(stateBase.motionlessTransition()).toBe(true);
    });

    it("should be false if only current image has structure", () => {
        const state: IStateBase = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: ImageHelper = new ImageHelper();

        const imageEnt1: ImageEnt = helper.createImageEnt();
        imageEnt1.merge_id = "1";
        const image1 = new TestImage(imageEnt1);
        image1.makeComplete(imageEnt1);
        image1.initializeCache(new ImageCache(new DataProvider()));
        image1.cacheCamera(new ProjectionService());
        image1.mesh = {
            vertices: [],
            faces: [],
        };

        const imageEnt2: ImageEnt = helper.createImageEnt();
        imageEnt2.merge_id = "1";
        const image2 = new TestImage(imageEnt2);
        image2.makeComplete(imageEnt2);
        image2.initializeCache(new ImageCache(new DataProvider()));
        image2.cacheCamera(new ProjectionService());
        image2.mesh = {
            vertices: [0, 0, 0, 1, 1, 1, 2, 2, 2],
            faces: [0, 1, 2],
        };

        stateBase.set([image1]);
        stateBase.set([image2]);

        expect(stateBase.motionlessTransition()).toBe(true);
    });

    it("should be true if instantaneous transition mode", () => {
        const state: IStateBase = createState();
        state.transitionMode = TransitionMode.Instantaneous;
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: ImageHelper = new ImageHelper();

        const imageEnt1: ImageEnt = helper.createImageEnt();
        imageEnt1.merge_id = "1";
        const image1: Image = new TestImage(imageEnt1);
        image1.makeComplete(imageEnt1);
        image1.initializeCache(new ImageCache(new DataProvider()));
        image1.cacheCamera(new ProjectionService());

        const imageEnt2: ImageEnt = helper.createImageEnt();
        imageEnt2.merge_id = "1";
        const image2: Image = new TestImage(imageEnt2);
        image2.makeComplete(imageEnt2);
        image2.initializeCache(new ImageCache(new DataProvider()));
        image2.cacheCamera(new ProjectionService());

        stateBase.set([image1]);
        stateBase.set([image2]);

        expect(stateBase.motionlessTransition()).toBe(true);
    });
});

describe("StateBase.set", () => {
    it("should set current image", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        let image: Image = createCompleteImage();
        stateBase.set([image]);

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should set multiple images", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.set([
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
        ]);

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(3);
    });
});

describe("StateBase.remove", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should throw when removing negative number", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        expect((): void => { stateBase.remove(-1); }).toThrowError(Error);
    });

    it("should throw when removing current image", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        let image: Image = createCompleteImage();
        stateBase.set([image]);

        expect((): void => { stateBase.remove(1); }).toThrowError(Error);
    });

    it("should throw when removing previous image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.set([createCompleteImage()]);
        stateBase.prepend([createCompleteImage()]);

        expect((): void => { stateBase.remove(1); }).toThrowError(Error);
    });

    it("should remove one image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([createCompleteImage(), createCompleteImage()]);

        stateBase.remove(1);

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple images", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
        ]);

        stateBase.remove(3);

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});

describe("StateBase.clear", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should clear empty state without affecting it", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.clear();

        expect(stateBase.currentIndex).toBe(state.currentIndex);
    });

    it("should remove one previous image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([createCompleteImage(), createCompleteImage()]);

        stateBase.clear();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple previous images", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
        ]);

        stateBase.clear();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove one coming image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.append([createCompleteImage()]);

        stateBase.clear();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should remove multiple coming images", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.append([
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
        ]);

        stateBase.clear();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should remove one previous and one coming image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([createCompleteImage(), createCompleteImage()]);
        stateBase.append([createCompleteImage()]);

        stateBase.clear();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});

describe("StateBase.clearPrior", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should clear prior of empty state without affecting it", () => {
        let state: IStateBase = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.clearPrior();

        expect(stateBase.currentIndex).toBe(state.currentIndex);
    });

    it("should remove one previous image", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([createCompleteImage(), createCompleteImage()]);

        stateBase.clearPrior();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple previous images", () => {
        let state: IStateBase = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreImage: CoreImageEnt = helper.createCoreImageEnt();
        coreImage.id = "currentImage";
        let image: TestImage = new TestImage(coreImage);
        image.makeComplete(helper.createSpatialImageEnt());
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        stateBase.set([image]);
        stateBase.prepend([
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
            createCompleteImage(),
        ]);

        stateBase.clearPrior();

        expect(stateBase.currentImage).toBeDefined();
        expect(stateBase.currentImage.id).toBe(image.id);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});
