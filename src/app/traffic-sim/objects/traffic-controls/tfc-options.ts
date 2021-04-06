import { Vector3 } from "three";
import { TrafficObjectOptions } from "../traffic-object-options";
import { TfcState } from "./tfc-state";

export interface TfcOptions extends TrafficObjectOptions {
    startState?: TfcState;
    changeDelay?: number;
    roadName?: string;
    type?: string;
    location?: Vector3;
}