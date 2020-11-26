import { ArgumentMapillaryError } from "../../Error";
import { Node } from "../../Graph";
import {
    Camera,
    Geo,
    GeoCoords,
    ILatLonAlt,
    Transform,
    Spatial,
} from "../../Geo";
import {
    IRotation,
    IState,
    TransitionMode,
} from "../../State";

export abstract class StateBase implements IState {
    protected _spatial: Spatial;
    protected _geoCoords: GeoCoords;

    protected _reference: ILatLonAlt;

    protected _alpha: number;
    protected _camera: Camera;
    protected _zoom: number;

    protected _currentIndex: number;

    protected _trajectory: Node[];
    protected _currentNode: Node;
    protected _previousNode: Node;

    protected _trajectoryTransforms: Transform[];

    protected _trajectoryCameras: Camera[];
    protected _currentCamera: Camera;
    protected _previousCamera: Camera;

    protected _motionless: boolean;

    private _referenceThreshold: number;
    private _transitionMode: TransitionMode;

    constructor(state: IState) {
        this._spatial = new Spatial();
        this._geoCoords = new GeoCoords();

        this._referenceThreshold = 0.01;
        this._transitionMode = state.transitionMode;

        this._reference = state.reference;

        this._alpha = state.alpha;
        this._camera = state.camera.clone();
        this._zoom = state.zoom;

        this._currentIndex = state.currentIndex;

        this._trajectory = state.trajectory.slice();
        this._trajectoryTransforms = [];
        this._trajectoryCameras = [];

        for (let node of this._trajectory) {
            let translation: number[] = this._nodeToTranslation(node, this._reference);
            let transform: Transform = new Transform(
                node.orientation,
                node.width,
                node.height,
                node.focal,
                node.scale,
                node.gpano,
                node.rotation,
                translation,
                node.image,
                undefined,
                node.ck1,
                node.ck2,
                node.cameraProjectionType);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }

        this._currentNode = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousNode = this._trajectory.length > 1 && this.currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;

        this._currentCamera = this._trajectoryCameras.length > 0 ?
            this._trajectoryCameras[this._currentIndex].clone() :
            new Camera();

        this._previousCamera = this._trajectoryCameras.length > 1 && this.currentIndex > 0 ?
            this._trajectoryCameras[this._currentIndex - 1].clone() :
            this._currentCamera.clone();
    }

    public get reference(): ILatLonAlt {
        return this._reference;
    }

    public get alpha(): number {
        return this._getAlpha();
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get zoom(): number {
        return this._zoom;
    }

    public get trajectory(): Node[] {
        return this._trajectory;
    }

    public get currentIndex(): number {
        return this._currentIndex;
    }

    public get currentNode(): Node {
        return this._currentNode;
    }

    public get previousNode(): Node {
        return this._previousNode;
    }

    public get currentCamera(): Camera {
        return this._currentCamera;
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

    public earth(): StateBase { throw new Error("Not implemented"); }

    public traverse(): StateBase { throw new Error("Not implemented"); }

    public wait(): StateBase { throw new Error("Not implemented"); }

    public waitInteractively(): StateBase { throw new Error("Not implemented"); }

    public move(delta: number): void { /*noop*/ }

    public moveTo(position: number): void { /*noop*/ }

    public rotate(delta: IRotation): void { /*noop*/ }

    public rotateUnbounded(delta: IRotation): void { /*noop*/ }

    public rotateWithoutInertia(delta: IRotation): void { /*noop*/ }

    public rotateBasic(basicRotation: number[]): void { /*noop*/ }

    public rotateBasicUnbounded(basicRotation: number[]): void { /*noop*/ }

    public rotateBasicWithoutInertia(basicRotation: number[]): void { /*noop*/ }

    public rotateToBasic(basic: number[]): void { /*noop*/ }

    public setSpeed(speed: number): void { /*noop*/ }

    public zoomIn(delta: number, reference: number[]): void { /*noop*/ }

    public update(fps: number): void { /*noop*/ }

    public setCenter(center: number[]): void { /*noop*/ }

    public setZoom(zoom: number): void { /*noop*/ }

    public dolly(delta: number): void { /*noop*/ }

    public orbit(rotation: IRotation): void { /*noop*/ }

    public truck(direction: number[]): void { /*noop*/ }

    public append(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        if (this._currentIndex < 0) {
            this.set(nodes);
        } else {
            this._trajectory = this._trajectory.concat(nodes);
            this._appendToTrajectories(nodes);
        }
    }

    public prepend(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw Error("Trajectory can not be empty");
        }

        this._trajectory = nodes.slice().concat(this._trajectory);
        this._currentIndex += nodes.length;

        this._setCurrentNode();

        let referenceReset: boolean = this._setReference(this._currentNode);
        if (referenceReset) {
            this._setTrajectories();
        } else {
            this._prependToTrajectories(nodes);
        }

        this._setCurrentCamera();
    }

    public remove(n: number): void {
        if (n < 0) {
            throw Error("n must be a positive integer");
        }

        if (this._currentIndex - 1 < n) {
            throw Error("Current and previous nodes can not be removed");
        }

        for (let i: number = 0; i < n; i++) {
            this._trajectory.shift();
            this._trajectoryTransforms.shift();
            this._trajectoryCameras.shift();
            this._currentIndex--;
        }

        this._setCurrentNode();
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

    public set(nodes: Node[]): void {
        this._setTrajectory(nodes);
        this._setCurrentNode();
        this._setReference(this._currentNode);
        this._setTrajectories();
        this._setCurrentCamera();
    }

    public getCenter(): number[] {
        return this._currentNode != null ?
            this.currentTransform.projectBasic(this._camera.lookat.toArray()) :
            [0.5, 0.5];
    }

    public setTransitionMode(mode: TransitionMode): void {
        this._transitionMode = mode;
    }

    protected _getAlpha(): number { return 1; }

    protected _setCurrent(): void {
        this._setCurrentNode();

        let referenceReset: boolean = this._setReference(this._currentNode);
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
        let nodesSet: boolean = this._currentNode != null && this._previousNode != null;

        return nodesSet && (
            this._transitionMode === TransitionMode.Instantaneous || !(
                this._currentNode.merged &&
                this._previousNode.merged &&
                this._withinOriginalDistance() &&
                this._sameConnectedComponent()
            ));
    }

    private _setReference(node: Node): boolean {
        // do not reset reference if node is within threshold distance
        if (Math.abs(node.latLon.lat - this.reference.lat) < this._referenceThreshold &&
            Math.abs(node.latLon.lon - this.reference.lon) < this._referenceThreshold) {
            return false;
        }

        // do not reset reference if previous node exist and transition is with motion
        if (this._previousNode != null && !this._motionlessTransition()) {
            return false;
        }

        this._reference.lat = node.latLon.lat;
        this._reference.lon = node.latLon.lon;
        this._reference.alt = node.alt;

        return true;
    }

    private _setCurrentNode(): void {
        this._currentNode = this._trajectory.length > 0 ?
            this._trajectory[this._currentIndex] :
            null;

        this._previousNode = this._currentIndex > 0 ?
            this._trajectory[this._currentIndex - 1] :
            null;
    }

    private _setTrajectory(nodes: Node[]): void {
        if (nodes.length < 1) {
            throw new ArgumentMapillaryError("Trajectory can not be empty");
        }

        if (this._currentNode != null) {
            this._trajectory = [this._currentNode].concat(nodes);
            this._currentIndex = 1;
        } else {
            this._trajectory = nodes.slice();
            this._currentIndex = 0;
        }
    }

    private _setTrajectories(): void {
        this._trajectoryTransforms.length = 0;
        this._trajectoryCameras.length = 0;

        this._appendToTrajectories(this._trajectory);
    }

    private _appendToTrajectories(nodes: Node[]): void {
        for (let node of nodes) {
            if (!node.assetsCached) {
                throw new ArgumentMapillaryError("Assets must be cached when node is added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node, this.reference);
            let transform: Transform = new Transform(
                node.orientation,
                node.width,
                node.height,
                node.focal,
                node.scale,
                node.gpano,
                node.rotation,
                translation,
                node.image,
                undefined,
                node.ck1,
                node.ck2,
                node.cameraProjectionType);

            this._trajectoryTransforms.push(transform);
            this._trajectoryCameras.push(new Camera(transform));
        }
    }

    private _prependToTrajectories(nodes: Node[]): void {
        for (let node of nodes.reverse()) {
            if (!node.assetsCached) {
                throw new ArgumentMapillaryError("Assets must be cached when added to trajectory");
            }

            let translation: number[] = this._nodeToTranslation(node, this.reference);
            let transform: Transform = new Transform(
                node.orientation,
                node.width,
                node.height,
                node.focal,
                node.scale,
                node.gpano,
                node.rotation,
                translation,
                node.image,
                undefined,
                node.ck1,
                node.ck2,
                node.cameraProjectionType);

            this._trajectoryTransforms.unshift(transform);
            this._trajectoryCameras.unshift(new Camera(transform));
        }
    }

    private _nodeToTranslation(node: Node, reference: ILatLonAlt): number[] {
        return Geo.computeTranslation(
            { alt: node.alt, lat: node.latLon.lat, lon: node.latLon.lon },
            node.rotation,
            reference);
    }

    private _sameConnectedComponent(): boolean {
        let current: Node = this._currentNode;
        let previous: Node = this._previousNode;

        return !!current && !!previous &&
            current.mergeCC === previous.mergeCC;
    }

    private _withinOriginalDistance(): boolean {
        let current: Node = this._currentNode;
        let previous: Node = this._previousNode;

        if (!current || !previous) {
            return true;
        }

        // 50 km/h moves 28m in 2s
        let distance: number = this._spatial.distanceFromLatLon(
            current.originalLatLon.lat,
            current.originalLatLon.lon,
            previous.originalLatLon.lat,
            previous.originalLatLon.lon);

        return distance < 25;
    }
}
