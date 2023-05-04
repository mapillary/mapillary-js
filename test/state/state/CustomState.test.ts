import { bootstrap } from "../../Bootstrap";
bootstrap();

import { Camera as ThreeCamera } from "three";

import { IStateBase } from "../../../src/state/interfaces/IStateBase";
import { CustomState } from "../../../src/state/state/CustomState";
import { generateStateParams } from "../../helper/StateHelper";

describe("CustomState.ctor", () => {
    it("should be defined", () => {
        const initial: IStateBase = generateStateParams();
        const state = new CustomState(initial);

        expect(state).toBeDefined();
    });
});

describe("CustomState.setViewMatrix", () => {
    it("should apply view matrix on camera", () => {
        const state = new CustomState(generateStateParams());

        // @ts-ignore
        const object: ThreeCamera = new ThreeCamera();
        object.up.set(0, 0, 1);
        object.position.set(1, 2, 3);
        object.lookAt(2, 2, 3);
        object.updateMatrixWorld(true);

        const viewMatrix = object.matrixWorld
            .clone()
            .invert()
            .toArray();

        state.setViewMatrix(viewMatrix);

        expect(state.camera.position.toArray()).toEqual([1, 2, 3]);
        expect(state.camera.up.toArray()).toEqual([0, 0, 1]);
        expect(state.camera.lookat.toArray()).toEqual([2, 2, 3]);
    });
});
