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
     * acceleration in Metres per Second
     */
    acceleration: number;
    /**
     * deceleration in Metres per Second
     */
    deceleration: number;
    /**
     * minimum time in milliseconds to wait after changing lanes before changing again
     */
    changeLaneDelay: number;
    /**
     * maximum speed this vehicle can sustain in Kilometres per Hour
     */
    maxSpeed: number;
    /**
     * the starting speed along the forward trajectory for this vehicle
     */
    startingVelocity?: number;
}