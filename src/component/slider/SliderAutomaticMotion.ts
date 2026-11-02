import * as THREE from "three";
import { Image } from "../../graph/Image";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { ViewportSize } from "../../render/interfaces/ViewportSize";
import { SliderConfiguration, SliderConfigurationMode } from "../interfaces/SliderConfiguration";
import { hasReconstructionMesh } from "../../util/Mesh";
import { SliderMeshFactory } from "./SliderMeshFactory";
import { SliderTransform } from "./SliderTransform";
import { sliderReconstructionImage, sliderPairKey, sliderCameraOrigin } from "./SliderReconstruction";

/** A camera-only translation: never interpolate direction/up or regenerate the
 * live projection (including its off-center crop). Curtain 0 is background. */
export function translatedSliderPerspective(
    live: THREE.PerspectiveCamera,
    previousOrigin: THREE.Vector3,
    currentOrigin: THREE.Vector3,
    curtain: number): THREE.PerspectiveCamera {
    const camera = live.clone();
    camera.position.copy(previousOrigin).lerp(currentOrigin, curtain);
    // Preserve the actual live world frame even with matrixAutoUpdate=false
    // (custom projections/controllers may maintain the matrices directly).
    camera.matrixAutoUpdate = false;
    camera.matrix.copy(live.matrixWorld).setPosition(camera.position);
    // A matrix-only edit does not set matrixWorldNeedsUpdate. Write both world
    // matrices explicitly so frozen/custom cameras really translate in GL and
    // raycasting, rather than only changing the public position property.
    camera.matrixWorld.copy(camera.matrix);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    return camera;
}

/** Conservative sampled coverage, NOT a mathematical proof of continuous
 * visibility. Both nearest mesh hits must be inside BOTH calibrated photos.
 * Uses the renderer's exact 5..200m clamped/expanded reconstruction geometry.
 * Requires one nonempty shared merge component, <=2m baseline (no cluster
 * exception), and <=10-degree native-to-translated parallax at every hit.
 * 7x7 rays cover the viewport plus 0.5% overscan; >=9 path stops (<=2m apart),
 * 1% photo inset and <=10k triangles per mesh bound the work. These guards
 * remain conservative heuristics, NOT a visual quality guarantee.
 * The component invalidates immediately on view change, then checks only a
 * settled view (not animation frames). One pair's geometry and at most eight
 * projection/viewport decisions are retained; manual 2D/3D reuses them.
 */
interface SliderMotionLimits {
    relaxed: boolean;
    sameMerge: boolean;
    maxBaseline: number;
    minParallaxCosine: number;
    minCoverage: number;
    maxDepthRatio: number;
}

const STRICT_LIMITS: SliderMotionLimits = {
    relaxed: false, sameMerge: true, maxBaseline: 2, minParallaxCosine: Math.cos(Math.PI / 18), minCoverage: 1,
    maxDepthRatio: Infinity,
};
// Time Travel candidates usually come from different merged
// reconstructions (one per capture), so only computed geo-poses relate them.
// Accept those up to the Time Travel matching radius, tolerating seams.
// Independent reconstructions of the SAME place must agree on where the
// surfaces are; unrelated frames (e.g. a garage under a street) do not.
const RELAXED_LIMITS: SliderMotionLimits = {
    relaxed: true, sameMerge: false, maxBaseline: 12, minParallaxCosine: Math.cos(35 * Math.PI / 180), minCoverage: 0.5,
    maxDepthRatio: 2,
};

export function sliderMotionLimits(configuration: SliderConfiguration): SliderMotionLimits {
    return configuration.automaticMotionPolicy === "relaxed" ? RELAXED_LIMITS : STRICT_LIMITS;
}

export class SliderAutomaticMotion {
    private _limits: SliderMotionLimits = STRICT_LIMITS;
    private _factory = new SliderMeshFactory();
    private _pair: string;
    private _meshes: object[] = [];
    private _geometries: THREE.BufferGeometry[] = [];
    private _transforms: SliderTransform[] = [];
    private _triangles: THREE.Triangle[][] = [];
    private _coverage = new Map<string, boolean>();
    private _origins: THREE.Vector3[] = [];
    private _prepared: boolean = false;

    public resolve(
        configuration: SliderConfiguration,
        state: IAnimationState,
        perspective: THREE.PerspectiveCamera,
        size: ViewportSize,
        renderedImageId: string): SliderConfigurationMode {
        if (!(configuration.automaticMotion === true && configuration.viewAligned === true)) {
            return configuration.mode;
        }
        try {
            const ids = configuration.ids;
            if (!state || !ids || !state.currentImage || !state.previousImage ||
                state.currentImage.id !== ids.foreground || state.previousImage.id !== ids.background ||
                renderedImageId !== ids.foreground || state.motionless !== false ||
                !perspective || !size || ![size.width, size.height].every(n => Number.isFinite(n) && n > 0)) {
                return SliderConfigurationMode.Stationary;
            }
            const limits = sliderMotionLimits(configuration);
            if (limits !== this._limits) { this.dispose(); this._limits = limits; }
            if (!this._prepare(state)) {
                return SliderConfigurationMode.Stationary;
            }
            const values = perspective.projectionMatrix.elements.concat(
                perspective.projectionMatrixInverse.elements, perspective.quaternion.toArray(), perspective.up.toArray(),
                perspective.matrixWorld.elements.slice(0, 12));
            if (!values.every(Number.isFinite) || !Number.isFinite(perspective.near) ||
                !Number.isFinite(perspective.far) || perspective.near <= 0 || perspective.far <= perspective.near ||
                Math.abs(perspective.projectionMatrix.determinant()) < 1e-12) {
                return SliderConfigurationMode.Stationary;
            }
            const key = values.concat([size.width, size.height, perspective.near, perspective.far]).join(",");
            if (!this._coverage.has(key)) {
                if (this._coverage.size >= 8) { this._coverage.delete(this._coverage.keys().next().value); }
                this._coverage.set(key, this._covered(perspective));
            }
            return this._coverage.get(key) && configuration.mode === SliderConfigurationMode.Motion ?
                SliderConfigurationMode.Motion : SliderConfigurationMode.Stationary;
        } catch (_) {
            // Partial hydration or corrupt camera/mesh data must fail closed.
            this.dispose();
            return SliderConfigurationMode.Stationary;
        }
    }

    public dispose(): void {
        this._geometries.forEach(g => g.dispose());
        this._geometries = [];
        this._transforms = [];
        this._triangles = [];
        this._origins = [];
        this._meshes = [];
        this._pair = null;
        this._prepared = false;
        this._coverage.clear();
    }

    private _prepare(state: IAnimationState): boolean {
        const pairImages = [state.previousImage, state.currentImage];
        const mergeId = pairImages[0].mergeId;
        // "Merged" independently is insufficient: computed GPS can place
        // unrelated reconstruction frames together (e.g. parking under a street).
        // Ray/photo hits only test local coverage, not global pose coherence.
        // Require the same nonempty aligned component BEFORE using any meshes.
        const limits = this._limits;
        if (limits.sameMerge && (typeof mergeId !== "string" || mergeId.trim().length === 0 ||
            mergeId !== pairImages[1].mergeId)) { return false; }
        const images = pairImages.map(sliderReconstructionImage);
        const transforms = [state.previousTransform, state.currentTransform];
        if (images.some(i => i.cameraType !== "perspective" || i.merged !== true) ||
            transforms.some(t => !t || t.cameraType !== "perspective")) { return false; }
        // The same bounded primitive pose/calibration/version key is used by
        // GL, including same-object mutations. Mesh snapshots are immutable.
        const pair = sliderPairKey(state);
        const meshes = images.map(i => i.mesh);
        if (pair === this._pair && meshes.every((m, n) => m === this._meshes[n])) {
            return this._prepared;
        }
        this.dispose();
        this._pair = pair;
        this._meshes = meshes;
        for (let n = 0; n < 2; n++) {
            const i = images[n];
            const t = transforms[n];
            if (!this._validImage(i) || !Number.isFinite(t.scale) || !t.hasValidScale ||
                !t.rt.elements.every(Number.isFinite) || Math.abs(t.rt.determinant()) < 1e-8) { return false; }
            const e = t.rt.elements;
            this._transforms.push(new SliderTransform(i.exifOrientation, i.width, i.height, i.scale,
                i.rotation, [e[12], e[13], e[14]], i.image, undefined,
                Object.values(i.camera.parameters), "perspective"));
        }
        this._origins = transforms.map(sliderCameraOrigin);
        const distance = this._origins[0].distanceTo(this._origins[1]);
        const ups = this._transforms.map(t => t.upVector());
        // Automatic opt-in only: sparse clamped meshes can have ample photo
        // coverage yet stretch badly across a large baseline. No cluster
        // exception to this conservative quality cap; legacy motion is unchanged.
        if (!Number.isFinite(distance) || distance > limits.maxBaseline ||
            ups.some(u => !u.toArray().every(Number.isFinite) || u.lengthSq() < 0.99) ||
            ups[0].angleTo(ups[1]) > Math.PI / 6) { return false; }
        for (let n = 0; n < 2; n++) {
            const geometry = this._factory.createReconstructionGeometry(images[n], this._transforms[n]);
            if (!geometry) { return false; }
            this._geometries.push(geometry);
            const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
            const indices = geometry.index;
            const triangles: THREE.Triangle[] = [];
            for (let j = 0; j < indices.count; j += 3) {
                const points = [0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(positions, indices.getX(j + k)));
                if (points.some(p => !p.toArray().every(Number.isFinite))) { return false; }
                triangles.push(new THREE.Triangle(points[0], points[1], points[2]));
            }
            this._triangles.push(triangles);
        }
        this._prepared = true;
        return true;
    }

    private _validImage(image: Image): boolean {
        const mesh = image.mesh;
        return image.camera && image.camera.type === "perspective" &&
            [1, 3, 6, 8].indexOf(image.exifOrientation) >= 0 &&
            [image.width, image.height, image.scale, image.camera.parameters.focal].every(n => Number.isFinite(n) && n > 0) &&
            image.scale > 0.01 && image.scale < 50 &&
            Array.isArray(image.rotation) && image.rotation.length === 3 && image.rotation.every(Number.isFinite) &&
            Object.values(image.camera.parameters).length <= 3 &&
            Object.values(image.camera.parameters).every(Number.isFinite) &&
            mesh && Array.isArray(mesh.vertices) && Array.isArray(mesh.faces) &&
            mesh.vertices.length >= 9 && mesh.vertices.length <= 3 * 65535 && mesh.vertices.length % 3 === 0 &&
            mesh.faces.length >= 3 && mesh.faces.length <= 30000 && mesh.faces.length % 3 === 0 &&
            hasReconstructionMesh(mesh) && mesh.vertices.every((v, n) => Number.isFinite(v) && (n % 3 !== 2 || v > 0)) &&
            mesh.faces.every(f => Number.isInteger(f) && f >= 0 && f < mesh.vertices.length / 3);
    }

    private _covered(live: THREE.PerspectiveCamera): boolean {
        const stops = Math.max(8, Math.ceil(this._origins[0].distanceTo(this._origins[1]) / 2));
        const ray = new THREE.Raycaster();
        const intersection = new THREE.Vector3();
        const limits = this._limits;
        const required = Math.ceil(49 * limits.minCoverage);
        for (let stop = 0; stop <= stops; stop++) {
            const camera = translatedSliderPerspective(live, this._origins[0], this._origins[1], stop / stops);
            let covered = 0;
            for (let y = 0; y < 7; y++) {
                for (let x = 0; x < 7; x++) {
                    if (this._rayCovered(ray, intersection, camera, x, y, limits)) { covered++; }
                    else if (limits.minCoverage >= 1) { return false; }
                }
            }
            if (covered < required) { return false; }
        }
        return true;
    }

    private _rayCovered(
        ray: THREE.Raycaster,
        intersection: THREE.Vector3,
        camera: THREE.PerspectiveCamera,
        x: number,
        y: number,
        limits: SliderMotionLimits): boolean {
        ray.setFromCamera(new THREE.Vector2(1.01 * (x / 3 - 1), 1.01 * (y / 3 - 1)), camera);
        if (!ray.ray.direction.toArray().every(Number.isFinite)) { throw new Error("Invalid slider ray"); }
        const depths: number[] = [];
        for (let meshIndex = 0; meshIndex < this._triangles.length; meshIndex++) {
            const triangles = this._triangles[meshIndex];
            let nearest = Infinity;
            let hit: THREE.Vector3 = null;
            for (const triangle of triangles) {
                if (ray.ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, intersection)) {
                    const distance = intersection.distanceTo(camera.position);
                    if (distance < nearest) { nearest = distance; hit = intersection.clone(); }
                }
            }
            // Also respect clipping; never count a clipped surface.
            if (!hit || this._transforms.some(t => !this._insidePhoto(hit, t))) { return false; }
            const nativeRay = hit.clone().sub(this._origins[meshIndex]);
            const translatedRay = hit.clone().sub(camera.position);
            const denominator = nativeRay.length() * translatedRay.length();
            const parallaxCosine = nativeRay.dot(translatedRay) / denominator;
            // Coverage alone does not rule out severe stretching of
            // sparse reconstruction triangles. Bound reprojection
            // parallax relative to this mesh's own photo origin.
            // This conservative heuristic is NOT a quality proof.
            if (!(denominator > 1e-8) || !Number.isFinite(parallaxCosine) ||
                parallaxCosine < limits.minParallaxCosine) { return false; }
            const depth = hit.clone().applyMatrix4(camera.matrixWorldInverse).z;
            if (-depth < camera.near || -depth > camera.far) { return false; }
            depths.push(nearest);
        }
        if (Number.isFinite(limits.maxDepthRatio) &&
            Math.max(...depths) > limits.maxDepthRatio * Math.min(...depths)) { return false; }
        return true;
    }

    private _insidePhoto(point: THREE.Vector3, transform: SliderTransform): boolean {
        const local = point.clone().applyMatrix4(transform.basicRt);
        if (!(local.z > 0)) { return false; }
        const radius = Math.hypot(local.x / local.z, local.y / local.z);
        // Reject the ambiguous/non-monotonic lens branch instead of trusting
        // the shader's radial clamp to manufacture coverage.
        if (Number.isFinite(transform.radialPeak) && radius >= transform.radialPeak) { return false; }
        const basic = transform.projectBasic(point.toArray());
        return basic.every(v => Number.isFinite(v) && v >= 0.01 && v <= 0.99);
    }
}
