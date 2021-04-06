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
    /**
     * indicates that this {RoadSegment} merges with other traffic so the
     * collision detection should look across a wider range
     */
    isInlet?: boolean;
}