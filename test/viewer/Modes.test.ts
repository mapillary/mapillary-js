import { State } from "../../src/state/State";
import { cameraControlsToState } from "../../src/viewer/Modes";
import { CameraControls } from "../../src/viewer/enums/CameraControls";

describe("cameraControlsToState", () => {
    it("converts to valid states", () => {
        expect(cameraControlsToState(CameraControls.Custom))
            .toBe(State.Custom);
        expect(cameraControlsToState(CameraControls.Earth))
            .toBe(State.Earth);
        expect(cameraControlsToState(CameraControls.Street))
            .toBe(State.Traversing);
        expect(cameraControlsToState(<CameraControls>-1))
            .toBe(null);
    });
});
