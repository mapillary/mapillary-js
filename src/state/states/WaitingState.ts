import {StateBase, IRotation} from "../../State";
import {Node} from "../../Graph";

export class WaitingState extends StateBase {
    public traverse(): StateBase {
        throw new Error("Not implemented");
    }

    public wait(): StateBase {
        throw new Error("Not implemented");
    }

    public update(): void { return; };

    public append(nodes: Node[]): void { return; };

    public remove(n: number): void { return; };

    public cut(): void { return; };

    public set(nodes: Node[]): void { return; };

    public rotate(delta: IRotation): void { return; };

    public move(delta: number): void { return; };

    protected _getAlpha(): number { return this._alpha; };
}
