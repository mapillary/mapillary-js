import { MeshContract } from "../api/contracts/MeshContract";

export function hasReconstructionMesh(mesh: MeshContract): boolean {
    return mesh != null &&
        mesh.vertices.length > 0 &&
        !isDefaultCubeMesh(mesh);
}

export function isDefaultCubeMesh(mesh: MeshContract): boolean {
    if (mesh.vertices.length !== 24 || mesh.faces.length !== 36) {
        return false;
    }

    const radius = Math.abs(mesh.vertices[0]);
    return radius > 0 && mesh.vertices.every(
        (coordinate: number): boolean =>
            Math.abs(Math.abs(coordinate) - radius) < 1e-8);
}
