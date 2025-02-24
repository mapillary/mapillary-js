import * as Geo from "../../geo/Geo";

import { TransitionMode } from "../TransitionMode";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";
import { ArgumentMapillaryError } from "../../error/ArgumentMapillaryError";
import { Camera } from "../../geo/Camera";
import { Spatial } from "../../geo/Spatial";
import { Transform } from "../../geo/Transform";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { Image } from "../../graph/Image";
import { IGeometryProvider } from "../../mapillary";
import { connectedComponent } from "../../api/CellMath";

export abstract class StateBase implements IStateBase {
    protected _spatial: Spatial;
    protected _geometry: IGeometryProvider;

    protected _reference: LngLatAlt;

    protected _alpha: number;
    protected _stateTransitionAlpha: number;
    protected _camera: Camera;
    protected _zoom: number;

    protected _currentIndex: number;

    protected _trajectory: Image[];
    protected _currentImage: Image;
    protected _previousImage: Image;

    protected _trajectoryTransforms: Transform[];

    protected _trajectoryCameras: Camera[];
    protected _currentCamera: Camera;
    protected _previousCamera: Camera;

    protected _motionless: boolean;

    private _referenceThreshold: number;
    private _referenceCellIds: Set<string>;
    private _transitionThreshold: number;
    private _transitionMode: TransitionMode;

    constructor(state: IStateBase) {
        this._spatial = new Spatial();
        this._geometry = state.geometry;

        this._referenceThreshold = 250;
        this._transitionThreshold = 62.5;
        this._transitionMode = state.transitionMode;

        this._reference = state.reference;
        this._referenceCellIds = new Set<string>(
            connectedComponent(
                this._geometry.lngLatToCellId(this._reference), 3, this._geometry));

        this._alpha = state.alpha;
        this._stateTransitionAlpha = 0;
        this._camera = state.camera.clone();
        this._zoom = state.zoom;

        this._currentIndex = state.currentIndex;

        this._trajectory = state.trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];

        for (let image of this._trajectory) {
            let translation: number[] = this._imageToTranslation(image, this._reference);
            let transform: Transform = new Transform(
                image.exifOrientation,
                image.width,
                image.height,
                image.scale,
                image.rotation,
                translation,
                image.image,
                image.camera);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }

        this._currentImage = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousImage = this._trajectory.length > 1 && this.currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;

        this._currentCamera = this._trajectoryCameras.length > 0 ?
            this._trajectoryCameras[this._currentIndex].clone() :
            new Camera();

        this._previousCamera = this._trajectoryCameras.length > 1 && this.currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();
    }

    public get reference(): LngLatAlt {
        return this._reference;
    }

    public get alpha(): number {
        return this._getAlpha();
    }

    public get stateTransitionAlpha(): number {
        return this._getStateTransitionAlpha();
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get geometry(): IGeometryProvider {
        return this._geometry;
    }

    public get zoom(): number {
        return this._zoom;
    }

    public get trajectory(): Image[] {
        return this._trajectory;
    }

    public get currentIndex(): number {
        return this._currentIndex;
    }

    public get currentImage(): Image {
        return this._currentImage;
    }

    public get previousImage(): Image {
        return this._previousImage;
    }

    public get currentCamera(): Camera {
        return this._currentCamera;
    }

    public get previousCamera(): Camera {
        return this._previousCamera;
    }

    public get currentTransform(): Transform {
        return this._trajectoryTransforms.length > 0 ?
            this._trajectoryTransforms[this.currentIndex] : null;
    }

    public get previousTransform(): Transform {
        return this._trajectoryTransforms.length > 1 && this.currentIndex > 0 ?
            this._trajectoryTransforms[this.currentIndex - 1] : null;
    }

    public get motionless(): boolean {
        return this._motionless;
    }

    public get transitionMode(): TransitionMode {
        return this._transitionMode;
    }

    public move(delta: number): void { /*noop*/ }

    public moveTo(position: number): void { /*noop*/ }

    public rotate(delta: EulerRotation): void { /*noop*/ }

    public rotateUnbounded(delta: EulerRotation): void { /*noop*/ }

    public rotateWithoutInertia(delta: EulerRotation): void { /*noop*/ }

    public rotateBasic(basicRotation: number[]): void { /*noop*/ }

    public rotateBasicUnbounded(basicRotation: number[]): void { /*noop*/ }

    public rotateBasicWithoutInertia(basicRotation: number[]): void { /*noop*/ }

    public rotateToBasic(basic: number[]): void { /*noop*/ }

    public setSpeed(speed: number): void { /*noop*/ }

    public zoomIn(delta: number, reference: number[]): void { /*noop*/ }

    public update(delta: number): void { /*noop*/ }

    public setCenter(center: number[]): void { /*noop*/ }

    public setZoom(zoom: number): void { /*noop*/ }

    public dolly(delta: number): void { /*noop*/ }

    public orbit(rotation: EulerRotation): void { /*noop*/ }

    public setViewMatrix(matrix: number[]): void { /*noop*/ }

    public truck(direction: number[]): void { /*noop*/ }

    public append(images: Image[]): void {
        if (images.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._currentIndex < 0) {
            this.set(images);
        } else {
            this._trajectory = this._trajectory.concat(images);
            this._appendToTrajectories(images);
        }
    }

    public prepend(images: Image[]): void {
        if (images.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectory = images.slice().concat(this._trajectory);
        this._currentIndex += images.length;

        this._setCurrentImage();

        let referenceReset: boolean = this._setReference();
        if (referenceReset) {
            this._setTrajectories();
        } else {
            this._prependToTrajectories(images);
        }

        this._setCurrentCamera();
    }

    public remove(n: number): void {
        if (n < 0) {
            throw Error("n must be a positive integer");
        }

        if (this._currentIndex - 1 < n) {
            throw Error("Current and previous images can not be removed");
        }

        for (let i: number = 0; i < n; i++) {
            this._trajectory.shift();
            this._trajectoryTransforms.shift();
            this._trajectoryCameras.shift();
            this._currentIndex--;
        }

        this._setCurrentImage();
    }

    public clearPrior(): void {
        if (this._currentIndex > 0) {
            this.remove(this._currentIndex - 1);
        }
    }

    public clear(): void {
        this.cut();

        if (this._currentIndex > 0) {
            this.remove(this._currentIndex - 1);
        }
    }

    public cut(): void {
        while (this._trajectory.length - 1 > this._currentIndex) {
            this._trajectory.pop();
            this._trajectoryTransforms.pop();
            this._trajectoryCameras.pop();
        }
    }

    public set(images: Image[]): void {
        this._setTrajectory(images);
        this._setCurrentImage();
        this._setReference();
        this._setTrajectories();
        this._setCurrentCamera();
    }

    public getCenter(): number[] {
        return this._currentImage != null ?
            this.currentTransform.projectBasic(this._camera.lookat.toArray()) :
            [0.5, 0.5];
    }

    public setTransitionMode(mode: TransitionMode): void {
        this._transitionMode = mode;
    }

    protected _getAlpha(): number { return 1; }
    protected _getStateTransitionAlpha(): number { return 1; }

    protected _setCurrent(): void {
        this._setCurrentImage();

        let referenceReset: boolean = this._setReference();
        if (referenceReset) {
            this._setTrajectories();
        }

        this._setCurrentCamera();
    }

    protected _setCurrentCamera(): void {
        this._currentCamera = this._trajectoryCameras[this._currentIndex].clone();
        this._previousCamera = this._currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();
    }

    protected _motionlessTransition(): boolean {
        const imagesSet =
            this._currentImage != null &&
            this._previousImage != null;

        if (!imagesSet) {
            return false;
        }

        return this._transitionMode === TransitionMode.Instantaneous || !(
            this._currentImage.merged &&
            this._previousImage.merged &&
            this._hasStructure() &&
            this._withinDistance()
        );
    }

    private _setReference(): boolean {
        const { currentImage, previousImage, reference } = this;
        const referenceDistance = this._spatial.distanceFromLngLat(
            currentImage.lngLat.lng,
            currentImage.lngLat.lat,
            reference.lng,
            reference.lat);

        if (referenceDistance < this._referenceThreshold) {
            return false;
        }

        // do not reset reference if image is within 7 x 7 grid of cells
        const cellId = this._geometry.lngLatToCellId(currentImage.lngLat);
        if (this._referenceCellIds.has(cellId)) {
            return false;
        }

        if (previousImage != null) {
            const transitionDistance = this._spatial.distanceFromLngLat(
                currentImage.lngLat.lng,
                currentImage.lngLat.lat,
                previousImage.lngLat.lng,
                previousImage.lngLat.lat);

            if (transitionDistance < this._transitionThreshold) {
                return false;
            }
        }

        // do not reset reference if previous image exist and
        // transition is with motion
        if (previousImage != null && !this._motionlessTransition()) {
            return false;
        }

        this._reference.lat = currentImage.lngLat.lat;
        this._reference.lng = currentImage.lngLat.lng;
        this._reference.alt = currentImage.computedAltitude;
        this._referenceCellIds = new Set<string>(
            connectedComponent(
                this._geometry.lngLatToCellId(this._reference), 3, this._geometry));

        return true;
    }

    private _setCurrentImage(): void {
        this._currentImage = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousImage = this._currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;
    }

    private _setTrajectory(images: Image[]): void {
        if (images.length < 1) {
            throw new ArgumentMapillaryError("Trajectory can not be empty");
        }

        if (this._currentImage != null) {
            this._trajectory = [this._currentImage].concat(images);
            this._currentIndex = 1;
        } else {
            this._trajectory = images.slice();
            this._currentIndex = 0;
        }
    }

    private _setTrajectories(): void {
        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;

        this._appendToTrajectories(this._trajectory);
    }

    private _appendToTrajectories(images: Image[]): void {
        for (let image of images) {
            if (!image.assetsCached) {
                throw new ArgumentMapillaryError("Assets must be cached when image is added to trajectory");
            }

            let translation: number[] = this._imageToTranslation(image, this.reference);
            let transform: Transform = new Transform(
                image.exifOrientation,
                image.width,
                image.height,
                image.scale,
                image.rotation,
                translation,
                image.image,
                image.camera);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }
    }

    private _prependToTrajectories(images: Image[]): void {
        for (let image of images.reverse()) {
            if (!image.assetsCached) {
                throw new ArgumentMapillaryError("Assets must be cached when added to trajectory");
            }

            let translation: number[] = this._imageToTranslation(image, this.reference);
            let transform: Transform = new Transform(
                image.exifOrientation,
                image.width,
                image.height,
                image.scale,
                image.rotation,
                translation,
                image.image,
                image.camera);

            this._trajectoryTransforms.unshift(transform);
            this._trajectoryCameras.unshift(new Camera(transform));
        }
    }

    private _imageToTranslation(image: Image, reference: LngLatAlt): number[] {
        return Geo.computeTranslation(
            { alt: image.computedAltitude, lat: image.lngLat.lat, lng: image.lngLat.lng },
            image.rotation,
            reference);
    }

    private _hasStructure(): boolean {
        const current = this._currentImage;
        const previous = this._previousImage;

        return current.mesh.vertices.length > 0 &&
            previous.mesh.vertices.length > 0;
    }

    private _withinDistance(): boolean {
        const current = this._currentImage;
        const previous = this._previousImage;

        if (!current || !previous) {
            return true;
        }

        const distance = this._spatial.distanceFromLngLat(
            current.lngLat.lng,
            current.lngLat.lat,
            previous.lngLat.lng,
            previous.lngLat.lat);

        // 50 km/h moves 28m in 2s
        return distance < 30;
    }
}
