import { Box3, Mesh, Object3D } from "three";

export interface Renderable {
    getObj3D(): Object3D;
    getMesh(): Mesh;
    getBoundingBox(): Box3;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}