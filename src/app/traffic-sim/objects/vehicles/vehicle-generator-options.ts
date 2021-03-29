import { Vector3 } from "three";

export interface VehicleGeneratorOptions {
    location: Vector3;
    roadName: string;
    delay: number;
    max: number;
}