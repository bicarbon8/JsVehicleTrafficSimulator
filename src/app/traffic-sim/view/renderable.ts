import { BoundingInfo, Mesh, StandardMaterial }from "@babylonjs/core";

export interface Renderable {
    readonly mesh: Mesh;
    readonly boundingBox: BoundingInfo;
    readonly material: StandardMaterial;
    hasPhysics: boolean;
    update(elapsedMs: number): void;
    disposeGeometry(): void;
}