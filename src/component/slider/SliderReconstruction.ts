import { Image } from "../../graph/Image";
import { MeshContract } from "../../api/contracts/MeshContract";
import * as THREE from "three";
import { IAnimationState } from "../../state/interfaces/IAnimationState";
import { Transform } from "../../geo/Transform";

const meshVersions = new WeakMap<object, number>();
let nextMeshVersion = 0;

/** Bounded primitive snapshot shared by safety, GL geometry, and tile ROI.
 * Includes calibration/extrinsics even when an Image/Transform is mutated in
 * place. Mesh versions follow immutable shared snapshots, never frame hashes.
 */
export function sliderPairKey(state: IAnimationState): string {
    return JSON.stringify([state.motionless, ...[state.previousImage, state.currentImage].map((image, n) => {
        const transform = n === 0 ? state.previousTransform : state.currentTransform;
        if (!image) { return null; }
        const mesh = image.mesh;
        let version = 0;
        if (mesh && typeof mesh === "object") {
            if (!meshVersions.has(mesh)) { meshVersions.set(mesh, ++nextMeshVersion); }
            version = meshVersions.get(mesh);
        }
        return [image.id, image.cameraType, image.merged, image.mergeId, image.clusterId,
            image.width, image.height, image.scale, image.exifOrientation,
            Array.isArray(image.rotation) ? image.rotation.slice(0, 3) : null,
            image.rotation && image.rotation.length,
            image.camera && image.camera.type,
            image.camera && image.camera.parameters ?
                [Object.keys(image.camera.parameters).length, ...Object.values(image.camera.parameters).slice(0, 3)] : null,
            transform && transform.cameraType, transform && transform.scale,
            transform && transform.rt && transform.rt.elements.slice(0, 16), version];
    })]);
}

/**
 * Read the actual current extrinsics, not a cached inverse which may predate
 * an in-place RT update. Used by coverage, render translation and tile ROI.
 */
export function sliderCameraOrigin(transform: Transform): THREE.Vector3 {
    return new THREE.Vector3().setFromMatrixPosition(transform.rt.clone().invert());
}

export function sliderViewAlignedStationary(state: IAnimationState, viewAligned: boolean): boolean {
    return viewAligned && (state.motionless || !state.currentImage || !state.previousImage ||
        state.currentImage.cameraType !== "perspective" || state.previousImage.cameraType !== "perspective");
}

// Coverage and automatic rendering share the SAME immutable reconstruction
// snapshot. Never freeze/mutate graph cache data or hash a large mesh per frame.
// An in-place provider mutation cannot change rendered geometry behind a cached
// coverage decision. Providers replace the mesh object to supply a new version.
const snapshots = new WeakMap<MeshContract, MeshContract>();

export function sliderReconstructionImage(image: Image): Image {
    const source = image.mesh;
    if (!source) { return image; }
    let snapshot = snapshots.get(source);
    if (!snapshot) {
        if (!Array.isArray(source.vertices) || !Array.isArray(source.faces) ||
            source.vertices.length > 3 * 65535 || source.faces.length > 30000) {
            // Oversized/corrupt data is rejected by safety before any copying.
            return image;
        }
        snapshot = Object.freeze({
            vertices: Object.freeze(source.vertices.slice()) as unknown as number[],
            faces: Object.freeze(source.faces.slice()) as unknown as number[],
        });
        snapshots.set(source, snapshot);
    }
    const copy = Object.create(image) as Image;
    Object.defineProperty(copy, "mesh", { value: snapshot });
    return copy;
}
