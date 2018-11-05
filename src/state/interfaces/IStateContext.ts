import {
    ICurrentState,
    IRotation,
    State,
    TransitionMode,
} from "../../State";
import {Node} from "../../Graph";

export interface IStateContext extends ICurrentState {
    earth(): void;
    traverse(): void;
    wait(): void;
    waitInteractively(): void;

    update(fps: number): void;
    append(nodes: Node[]): void;
    prepend(nodes: Node[]): void;
    remove(n: number): void;
    clear(): void;
    clearPrior(): void;
    cut(): void;
    set(nodes: Node[]): void;

    rotate(delta: IRotation): void;
    rotateUnbounded(delta: IRotation): void;
    rotateWithoutInertia(delta: IRotation): void;
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
    orbit(rotation: IRotation): void;
    truck(direction: number[]): void;
}
