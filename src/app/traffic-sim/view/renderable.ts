import { Box3, Mesh, MeshBasicMaterial, Object3D } from "three";

export interface Renderable {
    readonly obj3D: Object3D;
    readonly mesh: Mesh;
    readonly boundingBox: Box3;
    readonly material: MeshBasicMaterial;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}