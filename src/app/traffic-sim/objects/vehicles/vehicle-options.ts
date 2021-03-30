import { TrafficObjectOptions } from "../traffic-object-options";

export interface VehicleOptions extends TrafficObjectOptions {
    /**
     * vehicle width in metres
     */
    width: number;
    /**
     * vehicle length in metres
     */
    length: number;
    /**
     * vehicle height in metres
     */
    height: number;
    /**
     * milliseconds to react
     */
    reactionTime: number;
    /**
     * acceleration in Kilometres per Hour
     */
    acceleration: number;
    /**
     * deceleration in Kilometres per Hour
     */
    deceleration: number;
    /**
     * minimum time in milliseconds to wait after changing lanes before changing again
     */
    changeLaneDelay: number;
    /**
     * maximum velocity this vehicle can sustain in Kilometres per Hour
     */
    maxVelocity: number;
}