import {StateBase, IRotation} from "../../State";
import {Node} from "../../Graph";

export class WaitingState extends StateBase {
    public update(): void { return; };

    public append(nodes: Node[]): void { return; };

    public remove(n: number): void { return; };

    public cut(): void { return; };

    public set(nodes: Node[]): void { return; };

    public rotate(delta: IRotation): void { return; };

    protected _getAlpha(): number { return this._alpha; };
}
