import { BoundingInfo, Material, Mesh } from "babylonjs";

export interface Renderable {
    readonly mesh: Mesh;
    readonly boundingBox: BoundingInfo;
    readonly material: Material;
    hasPhysics: boolean;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}