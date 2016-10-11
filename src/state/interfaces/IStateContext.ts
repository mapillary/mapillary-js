import {ICurrentState, IRotation, State} from "../../State";
import {NewNode} from "../../Graph";

export interface IStateContext extends ICurrentState {
    state: State;

    traverse(): void;
    wait(): void;

    update(fps: number): void;
    append(nodes: NewNode[]): void;
    prepend(nodes: NewNode[]): void;
    remove(n: number): void;
    cut(): void;
    set(nodes: NewNode[]): void;

    rotate(delta: IRotation): void;
    rotateBasic(basicRotation: number[]): void;
    rotateToBasic(basic: number[]): void;
    move(delta: number): void;
    moveTo(position: number): void;
    zoomIn(delta: number, reference: number[]): void;

    getCenter(): number[];
    setCenter(center: number[]): void;
    setZoom(zoom: number): void;
}
