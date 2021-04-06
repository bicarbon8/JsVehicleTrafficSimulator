import { Box3, Mesh, MeshBasicMaterial, Object3D } from "three";

export interface Renderable {
    getObj3D(): Object3D;
    getMesh(): Mesh;
    getBoundingBox(): Box3;
    getMaterial(): MeshBasicMaterial;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}