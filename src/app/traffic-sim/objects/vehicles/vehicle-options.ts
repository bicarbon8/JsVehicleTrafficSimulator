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
     * seconds to react
     */
    reactionTime: number;
    /**
     * metres per second
     */
    acceleration: number;
    /**
     * metres per second
     */
    deceleration: number;
    /**
     * minimum time to wait after changing lanes before changing again
     */
    changeLaneDelay: number;
}