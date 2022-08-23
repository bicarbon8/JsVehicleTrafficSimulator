import { Vector3 } from "three";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { Vehicle } from "../vehicles/vehicle";
import { TfcState } from "./tfc-state";

export type TfcOptions = TrafficObjectOptions & {
    startState?: TfcState;
    changeDelay?: number;
    roadName?: string;
    type?: string;
    location?: Vector3;
}

export abstract class TrafficFlowControl extends TrafficObject {
    readonly startState: TfcState;
    readonly changeDelay: number;
    readonly roadName: string;
    
    protected currentState: TfcState;
    protected elapsed: number;

    constructor(options?: TfcOptions, simMgr?: SimulationManager) {
        super(options);
        this.startState = (options?.startState === undefined) ? 2 : options?.startState;
        this.changeDelay = (options?.changeDelay === undefined) ? Infinity : options?.changeDelay;
        this.roadName = options?.roadName;
        this.currentState = this.startState;
        this.elapsed = 0;
    }

    abstract shouldStop(vehicle: Vehicle): boolean;

    getCurrentState(): TfcState {
        return this.currentState;
    }
}