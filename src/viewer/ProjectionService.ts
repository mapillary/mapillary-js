import {
    Observable,
    Subject,
    Subscription,
} from "rxjs";
import {
    publishReplay,
    refCount,
    startWith,
} from "rxjs/operators";

import {
    FisheyeCamera,
    FISHEYE_CAMERA_TYPE,
} from "../geometry/camera/FisheyeCamera";
import {
    PerspectiveCamera,
    PERSPECTIVE_CAMERA_TYPE,
} from "../geometry/camera/PerspectiveCamera";
import {
    SphericalCamera,
    SPHERICAL_CAMERA_TYPE,
} from "../geometry/camera/SphericalCamera";
import {
    CameraConstructor,
    ICamera,
} from "../geometry/interfaces/ICamera";
import { ICameraFactory } from "../geometry/interfaces/ICameraFactory";
import { GLShader, Shader } from "../shader/Shader";

export class ProjectionService implements ICameraFactory {
    private readonly _cameraFactory: { [type: string]: CameraConstructor; } = {};

    private _shader: GLShader;
    private _shader$: Observable<GLShader>;
    private _shaderChanged$: Subject<GLShader>;
    private _shaderSubscription: Subscription;

    constructor() {
        this.registerCamera(
            FISHEYE_CAMERA_TYPE,
            FisheyeCamera);
        this.registerCamera(
            PERSPECTIVE_CAMERA_TYPE,
            PerspectiveCamera);
        this.registerCamera(
            SPHERICAL_CAMERA_TYPE,
            SphericalCamera);

        this._shader = Shader.texture;
        this._shaderChanged$ = new Subject<GLShader>();
        this._shader$ = this._shaderChanged$.pipe(
            startWith(this._shader),
            publishReplay(1),
            refCount());

        this._shaderSubscription = this._shader$.subscribe();
    }

    public get shader$(): Observable<GLShader> {
        return this._shader$;
    }

    public dispose(): void {
        this._shaderSubscription.unsubscribe();
    }

    public getShader(): GLShader {
        return this._shader;
    }

    public makeCamera(type: string, parameters: number[]): ICamera {
        if (!(type in this._cameraFactory)) {
            return new PerspectiveCamera([0.85, 0, 0]);
        }

        return new this._cameraFactory[type](parameters);
    }

    public registerCamera(type: string, ctor: CameraConstructor): void {
        this._cameraFactory[type] = ctor;
    }

    public setShader(shader?: GLShader): void {
        if (!shader) {
            this._shader = Shader.texture;
        }

        this._shader = shader;
        this._shaderChanged$.next(this._shader);
    }
}
