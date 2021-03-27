import { Box3, Mesh } from "three";

export interface Renderable {
    getMesh(): Mesh;
    getBoundingBox(): Box3;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}