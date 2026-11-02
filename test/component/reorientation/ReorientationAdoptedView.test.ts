import { of, Subject } from "rxjs";
import { ReorientationComponent } from "../../../src/component/reorientation/ReorientationComponent";

function fixture(): any {
    const component: any = Object.create(ReorientationComponent.prototype);
    const image: any = { id: "image", sequenceId: "sequence", cameraType: "spherical" };
    const result: any = { valid: true, moving: true, seq: "sequence", basicX: 0.4, cca: 180, viewCompassAngle: 180 };
    const state = {
        getCenter: (): any => of([0.5, 0.5]),
        setCenter: jasmine.createSpy("setCenter"),
        setZoom: jasmine.createSpy("setZoom"),
        traverse: jasmine.createSpy("traverse"),
        gravityTraverse: jasmine.createSpy("gravityTraverse"),
        clearReorientations: jasmine.createSpy("clearReorientations"),
        rotateToBasic: jasmine.createSpy("rotateToBasic"),
        rotateToBasicSmooth: jasmine.createSpy("rotateToBasicSmooth"),
    };
    component._navigator = { stateService: state };
    component._engine = { precompute: (): any => Promise.resolve(), get: (): any => result };
    component._seed = (): any => ({});
    component._activeId = image.id;
    component._imageSequence = image.sequenceId;
    component._lastSeq = null;
    component._userViewRevision = 0;
    component._userOffsetX = 0;
    component._userOffsetY = 0;
    component._automaticHorizonLeveling = true;
    component._reorientToFront = true;
    component._settled$ = new Subject();
    const run = async (): Promise<void> => {
        component._reorient(image, null, null, false, false, 0);
        await Promise.resolve();
        await Promise.resolve();
    };
    return { component, state, run };
}

describe("Reorientation adopted URL view", () => {
    it("applies the exact adopted coordinates after the initial state transition", async () => {
        const f = fixture();
        const center = [0.679852275866379, 0.4936419199209455];
        f.component.adoptView(center, 1.25);
        await f.run();
        expect(f.state.traverse).toHaveBeenCalled();
        expect(f.state.setCenter).toHaveBeenCalledWith(center);
        expect(f.state.setZoom).toHaveBeenCalledWith(1.25);
        expect(f.state.rotateToBasic).not.toHaveBeenCalled();
        expect(f.state.rotateToBasicSmooth).not.toHaveBeenCalled();
        expect(f.component._userOffsetX).toBeCloseTo(center[0] - 0.4, 10);
        expect(f.component._adoptedView).toBeNull();
    });

    it("does not animate a large adopted pitch or an old sequence pitch reset", async () => {
        const f = fixture();
        f.component._userOffsetY = 0.3;
        f.component.adoptView([0.7, 0.2], 0);
        await f.run();
        expect(f.state.setCenter).toHaveBeenCalledWith([0.7, 0.2]);
        expect(f.state.setZoom).toHaveBeenCalledWith(0);
        expect(f.state.rotateToBasic).not.toHaveBeenCalled();
        expect(f.state.rotateToBasicSmooth).not.toHaveBeenCalled();
    });

    it("keeps ordinary automatic orientation when no view was adopted", async () => {
        const f = fixture();
        await f.run();
        expect(f.state.setCenter).not.toHaveBeenCalled();
        expect(f.state.rotateToBasicSmooth).toHaveBeenCalled();
    });
});
