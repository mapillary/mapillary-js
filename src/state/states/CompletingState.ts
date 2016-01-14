import {IState} from "../../State";
import {Node} from "../../Graph";
import {Camera, Transform} from "../../Geo";

export class CompletingState implements IState {
    public alpha: number;
    public camera: Camera;

    public trajectory: Node[];
    public currentIndex: number;

    public currentNode: Node;
    public previousNode: Node;

    private animationSpeed: number;

    private trajectoryTransforms: Transform[];
    private trajectoryCameras: Camera[];

    private currentCamera: Camera;
    private previousCamera: Camera;

    constructor (trajectory: Node[]) {
        this.alpha = trajectory.length > 0 ? 0 : 1;
        this.animationSpeed = 0.025;
        this.camera = new Camera();

        this.trajectory = trajectory.slice();
        this.trajectoryTransforms = [];
        this.trajectoryCameras = [];
        for (let node of this.trajectory) {
            let transform: Transform = new Transform(node);
            this.trajectoryTransforms.push(transform);
            this.trajectoryCameras.push(new Camera(transform));
        }

        this.currentIndex = 0;

        this.currentNode = trajectory.length > 0 ? trajectory[this.currentIndex] : null;
        this.previousNode = null;

        this.currentCamera = trajectory.length > 0 ? this.trajectoryCameras[this.currentIndex] : new Camera();
        this.previousCamera = this.currentCamera;
    }

    public append(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this.trajectory.length === 0) {
            this.alpha = 0;

            this.currentIndex = 0;
            this.currentNode = trajectory[this.currentIndex];
            this.previousNode = null;

            this.currentCamera = this.trajectoryCameras[this.currentIndex];
            this.previousCamera = this.currentCamera;
        }

        this.trajectory = this.trajectory.concat(trajectory);
        for (let node of trajectory) {
            let transform: Transform = new Transform(node);
            this.trajectoryTransforms.push(transform);
            this.trajectoryCameras.push(new Camera(transform));
        }
    }

    public remove(n: number): void {
        if (n < 0) {
            throw Error("n must be a positive integer");
        }

        let length: number = this.trajectory.length;

        if (length - (this.currentIndex + 1) < n) {
            throw Error("Current node can not be removed");
        }

        for (let i: number = 0; i < n; i++) {
            this.trajectory.pop();
        }
    }

    public cut(): void {
        while (this.trajectory.length - 1 > this.currentIndex) {
            this.trajectory.pop();
        }
    }

    public set(trajectory: Node[]): void {
        if (trajectory.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this.trajectoryTransforms.length = 0;
        this.trajectoryCameras.length = 0;
        if (this.currentNode != null) {
            this.trajectory = [this.currentNode].concat(trajectory);
            for (let node of this.trajectory) {
                let transform: Transform = new Transform(node);
                this.trajectoryTransforms.push(transform);
                this.trajectoryCameras.push(new Camera(transform));
            }
            this.currentIndex = 1;
        } else {
            this.trajectory = trajectory.slice();
            for (let node of this.trajectory) {
                let transform: Transform = new Transform(node);
                this.trajectoryTransforms.push(transform);
                this.trajectoryCameras.push(new Camera(transform));
            }
            this.currentIndex = 0;
        }

        this.alpha = 0;

        this.currentNode = this.trajectory[this.currentIndex];
        this.previousNode = this.trajectory[this.currentIndex - 1];

        this.currentCamera = this.trajectoryCameras[this.currentIndex];
        this.previousCamera = this.currentIndex > 0 ?
            this.trajectoryCameras[this.currentIndex - 1] :
            this.currentCamera;
    }

    public update(): void {
        if (this.alpha === 1 && this.currentIndex + this.alpha < this.trajectory.length) {
            this.alpha = 0;

            this.currentIndex += 1;
            this.currentNode = this.trajectory[this.currentIndex];
            this.previousNode = this.trajectory[this.currentIndex - 1];

            this.currentCamera = this.trajectoryCameras[this.currentIndex];
            this.previousCamera = this.currentIndex > 0 ?
                this.trajectoryCameras[this.currentIndex - 1] :
                this.currentCamera;
        }

        this.alpha = Math.min(1, this.alpha + this.animationSpeed);
        this.camera.lerpCameras(this.previousCamera, this.currentCamera, this.alpha);
    }

    public get currentTransform(): Transform {
        return this.trajectoryTransforms.length > 0 ?
            this.trajectoryTransforms[this.currentIndex] : null;
    }

    public get previousTransform(): Transform {
        return this.trajectoryTransforms.length > 0 && this.currentIndex > 0 ?
            this.trajectoryTransforms[this.currentIndex] : null;
    }
}
