import { Vector3 } from "three";
import { TrafficObjectOptions } from "../objects/traffic-object-options";

export interface RoadSegmentOptions extends TrafficObjectOptions {
    start: Vector3;
    end: Vector3;
    /**
     * width of {RoadSegment} in Metres
     */
    width?: number;
    /**
     * maximum legal speed allowed on {RoadSegment} in Kilometres per Hour
     */
    speedLimit?: number;
    isInlet?: boolean;
    isMergeLane?: boolean;
}