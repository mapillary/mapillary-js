import {Node} from "../Graph";

export class CompletingState {
    public trajectory: Node[];
    private alpha: number;
    private animationSpeed: number = 0.25;

    constructor (trajectory: Node[]) {
        this.trajectory = trajectory;
        this.alpha = 0;
        this.currentNode = trajectory.length > 0 ? trajectory[0] : null;
    }

    public setTrajectory(trajectory: Node[]): void {
        this.trajectory = this.trajectory.length > 0 ?
            [this.trajectory[Math.ceil(this.alpha)]].concat(trajectory) :
            trajectory;
        this.alpha = 0;
        this.currentNode = trajectory.length > 0 ? trajectory[0] : null;
    }

    public appendTrajectory(trajectory: Node[]): void {
        this.trajectory = this.trajectory.concat(trajectory);
    }

    public update(): void {
        if (this.alpha < this.trajectory.length - 1) {
            this.alpha += this.animationSpeed;
            this.alpha = Math.max(this.alpha, this.trajectory.length - 1);
        }
    }

    get currentNode(): Node {
        return this.trajectory.length > 0 ? this.trajectory[Math.ceil(this.alpha)] : null;
    }
}
