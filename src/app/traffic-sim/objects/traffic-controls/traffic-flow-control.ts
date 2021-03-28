import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject } from "../traffic-object";
import { TrafficObjectOptions } from "../traffic-object-options";
import { Vehicle } from "../vehicles/vehicle";
import { TfcOptions } from "./tfc-options";
import { TfcState } from "./tfc-state";

export abstract class TrafficFlowControl extends TrafficObject {
    readonly startState: TfcState;
    readonly changeDelay: number;
    readonly roadName: string;
    
    protected currentState: TfcState;
    protected elapsed: number;

    constructor(options?: TfcOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
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