import { IAnimationState } from "./IAnimationState";
import { EulerRotation } from "./EulerRotation";
import { TransitionMode } from "../TransitionMode";
import { Image } from "../../graph/Image";

export interface IStateContext extends IAnimationState {
    custom(): void;
    earth(): void;
    traverse(): void;
    wait(): void;
    waitInteractively(): void;

    update(fps: number): void;
    append(images: Image[]): void;
    prepend(images: Image[]): void;
    remove(n: number): void;
    clear(): void;
    clearPrior(): void;
    cut(): void;
    set(images: Image[]): void;

    setViewMatrix(matrix: number[]): void;

    rotate(delta: EulerRotation): void;
    rotateUnbounded(delta: EulerRotation): void;
    rotateWithoutInertia(delta: EulerRotation): void;
    rotateBasic(basicRotation: number[]): void;
    rotateBasicUnbounded(basicRotation: number[]): void;
    rotateBasicWithoutInertia(basicRotation: number[]): void;
    rotateToBasic(basic: number[]): void;
    move(delta: number): void;
    moveTo(position: number): void;
    zoomIn(delta: number, reference: number[]): void;

    getCenter(): number[];
    setCenter(center: number[]): void;
    setZoom(zoom: number): void;

    setSpeed(speed: number): void;
    setTransitionMode(mode: TransitionMode): void;

    dolly(delta: number): void;
    orbit(rotation: EulerRotation): void;
    truck(direction: number[]): void;
}
