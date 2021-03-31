import { Vector3 } from "three";
import { TrafficObjectOptions } from "../objects/traffic-object-options";

export interface RoadSegmentOptions extends TrafficObjectOptions {
    start: Vector3;
    end: Vector3;
    /**
     * name of the road to which this {RoadSegment} belongs. 
     * segments on the same {roadName} are lanes that vehicles
     * can switch in to and out of
     */
    roadName?: string;
    /**
     * width of {RoadSegment} in Metres
     */
    width?: number;
    /**
     * maximum legal speed allowed on {RoadSegment} in Kilometres per Hour
     */
    speedLimit?: number;
    isInlet?: boolean;
}