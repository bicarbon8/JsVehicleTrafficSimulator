import { Vector3 } from "three";
import { TrafficObjectOptions } from "../objects/traffic-object-options";

export interface RoadSegmentOptions extends TrafficObjectOptions {
    start: Vector3;
    end: Vector3;
    width?: number;
    speedLimit?: number;
    isInlet?: boolean;
    isMergeLane?: boolean;
}