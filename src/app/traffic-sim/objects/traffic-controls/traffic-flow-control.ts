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
        this.startState = options?.startState || TfcState.stop;
        this.changeDelay = options?.changeDelay || Infinity;
        this.roadName = options?.roadName;
        this.currentState = this.startState;
    }

    abstract shouldStop(vehicle: Vehicle): boolean;

    getCurrentState(): TfcState {
        return this.currentState;
    }
}