import {
    Camera,
    Object3D,
    Raycaster,
    Vector2,
} from "three";
import { SpatialOctree } from "./SpatialOctree";
import { OCTREE_LEAF_LEVEL, OCTREE_ROOT_LEVEL } from "./SpatialOctreeMath";

export class SpatialIntersection {
    private readonly _interactiveLayer: number;
    private readonly _objects: Object3D[];
    private readonly _objectImageMap: Map<string, string>;
    private readonly _octree: SpatialOctree;
    private readonly _raycaster: Raycaster;

    private readonly _lineThreshold: number;
    private readonly _largeLineThreshold: number;

    constructor(
        octree?: SpatialOctree,
        raycaster?: Raycaster) {

        this._objects = [];
        this._objectImageMap = new Map();
        this._octree = octree ?? new SpatialOctree(
            OCTREE_ROOT_LEVEL,
            OCTREE_LEAF_LEVEL);
        this._raycaster = raycaster ?? new Raycaster();

        this._interactiveLayer = 1;
        this._raycaster = !!raycaster ?
            raycaster :
            new Raycaster(
                undefined,
                undefined,
                1,
                10000);

        this._lineThreshold = 0.2;
        this._largeLineThreshold = 0.4;

        this._raycaster.params.Line.threshold = this._lineThreshold;
        this._raycaster.layers.set(this._interactiveLayer);
    }

    get interactiveLayer(): number { return this._interactiveLayer; }
    get octree(): SpatialOctree { return this._octree; }
    get raycaster(): Raycaster { return this._raycaster; }

    public add(
        object: Object3D,
        imageId: string): void {
        const uuid = object.uuid;
        this._objectImageMap.set(uuid, imageId);
        this._objects.push(object);
        this._octree.add(object);
    }

    public intersectObjects(
        viewport: number[],
        camera: Camera)
        : string {

        this._raycaster.setFromCamera(
            new Vector2().fromArray(viewport),
            camera);
        const objects = this._octree.intersect(this.raycaster.ray);
        const intersects =
            this._raycaster.intersectObjects(objects);

        const onMap = this._objectImageMap;
        for (const intersect of intersects) {
            const uuid = intersect.object.uuid;
            if (!onMap.has(uuid)) { continue; }
            return onMap.get(uuid);
        }
        return null;
    }

    public remove(object: Object3D): void {
        const objects = this._objects;
        const index = objects.indexOf(object);
        if (index !== -1) {
            const deleted = objects.splice(index, 1);
            for (const d of deleted) {
                this._objectImageMap.delete(d.uuid);
            }
            this._octree.remove(object)
        } else {
            console.warn(`Object does not exist`);
        }
    }

    public resetIntersectionThreshold(useLarge: boolean): void {
        this._raycaster.params.Line.threshold = useLarge ?
            this._largeLineThreshold :
            this._lineThreshold;
    }
}
