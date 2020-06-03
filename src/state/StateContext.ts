import {
    EarthState,
    InteractiveWaitingState,
    IStateContext,
    StateBase,
    State,
    TransitionMode,
    TraversingState,
    WaitingState,
    IRotation,
} from "../State";
import {Node} from "../Graph";
import {
    Camera,
    ILatLonAlt,
    Transform,
} from "../Geo";

export class StateContext implements IStateContext {
    private _state: StateBase;

    constructor(transitionMode?: TransitionMode) {
        this._state = new TraversingState({
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: transitionMode == null ? TransitionMode.Default : transitionMode,
            zoom: 0,
        });
    }

    public get state(): State {
        if (this._state instanceof EarthState) {
            return State.Earth;
        } else if (this._state instanceof TraversingState) {
            return State.Traversing;
        } else if (this._state instanceof WaitingState) {
            return State.Waiting;
        } else if (this._state instanceof InteractiveWaitingState) {
            return State.WaitingInteractively;
        }

        throw new Error("Invalid state");
    }

    public get reference(): ILatLonAlt {
        return this._state.reference;
    }

    public get alpha(): number {
        return this._state.alpha;
    }

    public get camera(): Camera {
        return this._state.camera;
    }

    public get zoom(): number {
        return this._state.zoom;
    }

    public get currentNode(): Node {
        return this._state.currentNode;
    }

    public get previousNode(): Node {
        return this._state.previousNode;
    }

    public get currentCamera(): Camera {
        return this._state.currentCamera;
    }

    public get currentTransform(): Transform {
        return this._state.currentTransform;
    }

    public get previousTransform(): Transform {
        return this._state.previousTransform;
    }

    public get trajectory(): Node[] {
        return this._state.trajectory;
    }

    public get currentIndex(): number {
        return this._state.currentIndex;
    }

    public get lastNode(): Node {
        return this._state.trajectory[this._state.trajectory.length - 1];
    }

    public get nodesAhead(): number {
        return this._state.trajectory.length - 1 - this._state.currentIndex;
    }

    public get motionless(): boolean {
        return this._state.motionless;
    }

    public earth(): void {
        this._state = this._state.earth();
    }

    public traverse(): void {
        this._state = this._state.traverse();
    }

    public wait(): void {
        this._state = this._state.wait();
    }

    public waitInteractively(): void {
        this._state = this._state.waitInteractively();
    }

    public getCenter(): number[] {
        return this._state.getCenter();
    }

    public setCenter(center: number[]): void {
        this._state.setCenter(center);
    }

    public setZoom(zoom: number): void {
        this._state.setZoom(zoom);
    }

    public update(fps: number): void {
        this._state.update(fps);
    }

    public append(nodes: Node[]): void {
        this._state.append(nodes);
    }

    public prepend(nodes: Node[]): void {
        this._state.prepend(nodes);
    }

    public remove(n: number): void {
        this._state.remove(n);
    }

    public clear(): void {
        this._state.clear();
    }

    public clearPrior(): void {
        this._state.clearPrior();
    }

    public cut(): void {
        this._state.cut();
    }

    public set(nodes: Node[]): void {
        this._state.set(nodes);
    }

    public rotate(delta: IRotation): void {
        this._state.rotate(delta);
    }

    public rotateUnbounded(delta: IRotation): void {
        this._state.rotateUnbounded(delta);
    }

    public rotateWithoutInertia(delta: IRotation): void {
        this._state.rotateWithoutInertia(delta);
    }

    public rotateBasic(basicRotation: number[]): void {
        this._state.rotateBasic(basicRotation);
    }

    public rotateBasicUnbounded(basicRotation: number[]): void {
        this._state.rotateBasicUnbounded(basicRotation);
    }

    public rotateBasicWithoutInertia(basicRotation: number[]): void {
        this._state.rotateBasicWithoutInertia(basicRotation);
    }

    public rotateToBasic(basic: number[]): void {
        this._state.rotateToBasic(basic);
    }

    public move(delta: number): void {
        this._state.move(delta);
    }

    public moveTo(delta: number): void {
        this._state.moveTo(delta);
    }

    public zoomIn(delta: number, reference: number[]): void {
        this._state.zoomIn(delta, reference);
    }

    public setSpeed(speed: number): void {
        this._state.setSpeed(speed);
    }

    public setTransitionMode(mode: TransitionMode): void {
        this._state.setTransitionMode(mode);
    }

    public dolly(delta: number): void {
        this._state.dolly(delta);
    }

    public orbit(rotation: IRotation): void {
        this._state.orbit(rotation);
    }

    public truck(direction: number[]): void {
        this._state.truck(direction);
    }
}
