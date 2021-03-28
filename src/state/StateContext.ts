import { State } from "./State";
import { TransitionMode } from "./TransitionMode";
import { EulerRotation } from "./interfaces/EulerRotation";
import { IStateContext } from "./interfaces/IStateContext";
import { EarthState } from "./state/EarthState";
import { InteractiveWaitingState } from "./state/InteractiveWaitingState";
import { StateBase } from "./state/StateBase";
import { TraversingState } from "./state/TraversingState";
import { WaitingState } from "./state/WaitingState";

import { Camera } from "../geo/Camera";
import { Transform } from "../geo/Transform";
import { LatLonAlt } from "../api/interfaces/LatLonAlt";
import { Image } from "../graph/Image";

type StateCreators = Map<string, new (state: StateBase) => StateBase>;

class TransitionMatrix {
    private readonly _creators: StateCreators;
    private readonly _transitions: Map<string, string[]>;

    constructor() {
        const earth = State[State.Earth];
        const traverse = State[State.Traversing];
        const wait = State[State.Waiting];
        const waitInteractively = State[State.WaitingInteractively];

        this._creators = new Map();
        const creator = this._creators;
        creator.set(earth, EarthState);
        creator.set(traverse, TraversingState);
        creator.set(wait, WaitingState);
        creator.set(waitInteractively, InteractiveWaitingState);

        this._transitions = new Map();
        const transitions = this._transitions;
        transitions.set(earth, [traverse, wait, waitInteractively]);
        transitions.set(traverse, [earth, wait, waitInteractively]);
        transitions.set(wait, [traverse, waitInteractively]);
        transitions.set(waitInteractively, [traverse, wait]);
    }

    public transition(state: StateBase, to: State): StateBase {
        const source = State[this.getState(state)];
        const target = State[to];
        const transitions = this._transitions;

        if (!transitions.has(source) ||
            !transitions.get(source).includes(target)) {
            throw new Error("Invalid transition");
        }

        const stateImplementation = this._creators.get(target);
        return new stateImplementation(state);
    }

    public getState(state: StateBase): State {
        if (state instanceof EarthState) {
            return State.Earth;
        } else if (state instanceof TraversingState) {
            return State.Traversing;
        } else if (state instanceof WaitingState) {
            return State.Waiting;
        } else if (state instanceof InteractiveWaitingState) {
            return State.WaitingInteractively;
        }
        throw new Error("Invalid state instance");
    }
}

export class StateContext implements IStateContext {
    private _state: StateBase;
    private _transitions: TransitionMatrix;

    constructor(transitionMode?: TransitionMode) {
        this._transitions = new TransitionMatrix();
        this._state = new TraversingState({
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: transitionMode == null ? TransitionMode.Default : transitionMode,
            zoom: 0,
        });
    }

    public get state(): State {
        return this._transitions.getState(this._state);
    }

    public get reference(): LatLonAlt {
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

    public get currentImage(): Image {
        return this._state.currentImage;
    }

    public get previousImage(): Image {
        return this._state.previousImage;
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

    public get trajectory(): Image[] {
        return this._state.trajectory;
    }

    public get currentIndex(): number {
        return this._state.currentIndex;
    }

    public get lastImage(): Image {
        return this._state.trajectory[this._state.trajectory.length - 1];
    }

    public get imagesAhead(): number {
        return this._state.trajectory.length - 1 - this._state.currentIndex;
    }

    public get motionless(): boolean {
        return this._state.motionless;
    }

    public earth(): void {
        this._transition(State.Earth);
    }

    public traverse(): void {
        this._transition(State.Traversing);
    }

    public wait(): void {
        this._transition(State.Waiting);
    }

    public waitInteractively(): void {
        this._transition(State.WaitingInteractively);
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

    public append(images: Image[]): void {
        this._state.append(images);
    }

    public prepend(images: Image[]): void {
        this._state.prepend(images);
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

    public set(images: Image[]): void {
        this._state.set(images);
    }

    public rotate(delta: EulerRotation): void {
        this._state.rotate(delta);
    }

    public rotateUnbounded(delta: EulerRotation): void {
        this._state.rotateUnbounded(delta);
    }

    public rotateWithoutInertia(delta: EulerRotation): void {
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

    public orbit(rotation: EulerRotation): void {
        this._state.orbit(rotation);
    }

    public truck(direction: number[]): void {
        this._state.truck(direction);
    }

    private _transition(to: State): void {
        const state = this._transitions.transition(this._state, to);
        this._state = state;
    }
}
