import { GameObj, V2 } from "../../interfaces/custom-types";
import { Positionable } from "../../interfaces/positionable";
import { LaneSegment } from "../../map/lane-segment";
import { RoadmapScene } from "../../view/scenes/roadmap-scene";
import { PositionableSimObj, PositionableSimObjOptions } from "../positionable-sim-obj";
import { SimObj, SimObjOptions } from "../sim-obj";
import { Vehicle } from "../vehicles/vehicle";
import { TfcState } from "./tfc-state";

export type TfcOptions = PositionableSimObjOptions & {
    startState?: TfcState;
    changeDelay?: number;
    type?: string;
    laneSegment?: LaneSegment;
};

export abstract class TrafficFlowControl<T extends GameObj> extends PositionableSimObj<T> {
    readonly startState: TfcState;
    readonly changeDelay: number;
    laneSegment: LaneSegment;
    
    currentState: TfcState;

    constructor(options: TfcOptions) {
        super(options);
        this.laneSegment = options.laneSegment;
        this.startState = (options?.startState === undefined) ? 2 : options?.startState;
        this.changeDelay = (options?.changeDelay === undefined) ? Infinity : options?.changeDelay;
        this.currentState = this.startState;
    }

    abstract shouldStop(vehicle: Vehicle): boolean;
}