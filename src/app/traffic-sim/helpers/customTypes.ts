import { Vector3 } from "@babylonjs/core";

export type V1 = { x: number; };
export type V2 = V1 & { y: number; };
export type V3 = V2 & { z: number; };
export type V4 = V3 & { w: number; };

export module V3 {
    export function toVector3(v: V3): Vector3 {
        return new Vector3(v.x ?? 0, v.y ?? 0, v.z ?? 0);
    }
}