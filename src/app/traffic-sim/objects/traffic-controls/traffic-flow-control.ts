import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { Vehicle } from "../vehicles/vehicle";
import { V3 } from "../../helpers/customTypes";

export type TfcState = 'proceed' | 'caution' | 'stop';

export type TfcOptions = TrafficObjectOptions & {
    startState?: TfcState;
    changeDelay?: number;
    roadName?: string;
    type?: string;
    location?: V3;
}

export abstract class TrafficFlowControl extends TrafficObject {
    readonly startState: TfcState;
    readonly changeDelay: number;
    readonly roadName: string;
    
    private _state: TfcState;
    private _elapsed: number;

    constructor(options?: TfcOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.startState = options?.startState ?? 'stop';
        this.changeDelay = options?.changeDelay ?? Infinity;
        this.roadName = options?.roadName;
        this._state = this.startState;
        this._elapsed = 0;
    }

    update(elapsedMs: number): void {
        super.update(elapsedMs);
        this._elapsed += elapsedMs;
    }

    abstract shouldStop(vehicle: Vehicle): boolean;

    get state(): TfcState {
        return this._state;
    }

    public setState(state: TfcState): void {
        this._state = state ?? 'stop';
    }

    get elapsed(): number {
        return this._elapsed;
    }

    public resetElapsed(): void {
        this._elapsed = 0;
    }
}