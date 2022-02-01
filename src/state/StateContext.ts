import { State } from "./State";
import { TransitionMode } from "./TransitionMode";
import { EulerRotation } from "./interfaces/EulerRotation";
import { IStateContext } from "./interfaces/IStateContext";
import { StateBase } from "./state/StateBase";

import { Camera } from "../geo/Camera";
import { Transform } from "../geo/Transform";
import { LngLatAlt } from "../api/interfaces/LngLatAlt";
import { Image } from "../graph/Image";
import { StateTransitionMatrix } from "./StateTransitionMatrix";

export class StateContext implements IStateContext {
    private _state: StateBase;
    private _transitions: StateTransitionMatrix;

    constructor(
        state: State,
        transitionMode?: TransitionMode) {
        this._transitions = new StateTransitionMatrix();
        this._state = this._transitions.generate(
            state,
            {
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

    public get reference(): LngLatAlt {
        return this._state.reference;
    }

    public get alpha(): number {
        return this._state.alpha;
    }

    public get stateTransitionAlpha(): number {
        return this._state.stateTransitionAlpha;
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

    public custom(): void {
        this._transition(State.Custom);
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

    public update(delta: number): void {
        this._state.update(delta);
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

    public setViewMatrix(matrix: number[]): void {
        this._state.setViewMatrix(matrix);
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
        if (!this._transitions.validate(this._state, to)) {
            const from = this._transitions.getState(this._state);
            console.warn(
                `Transition not valid (${State[from]} - ${State[to]})`);
            return;
        }
        const state = this._transitions.transition(this._state, to);
        this._state = state;
    }
}
