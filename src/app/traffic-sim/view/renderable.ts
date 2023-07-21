import { Box3, Mesh, MeshStandardMaterial, Object3D } from "three";

export interface Renderable {
    readonly obj3D: Object3D;
    readonly mesh: Mesh;
    readonly boundingBox: Box3;
    readonly material: MeshStandardMaterial;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}