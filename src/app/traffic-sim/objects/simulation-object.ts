import { Utils } from '../helpers/utils';
import { GameObj, V2 } from '../interfaces/custom-types';
import { Disposable } from '../interfaces/disposable';
import { GameObject } from '../interfaces/game-object';
import { Positionable } from '../interfaces/positionable';
import { Updatable } from '../interfaces/updatable';
import { TrafficSim } from '../view/traffic-sim';

export type SimulationObjectOptions = {
    simulation: TrafficSim;
    id?: string;
    name?: string;
}

export abstract class SimulationObject implements Updatable, Disposable {
    readonly sim: TrafficSim;
    readonly id: string;
    readonly name: string;

    constructor(options: SimulationObjectOptions) {
        this.sim = options.simulation || TrafficSim.inst;
        this.id = Utils.guid();
        this.name = options.name || typeof this;
    }

    /** Updatable */
    abstract update(time: number, delta: number): void;

    /** Disposable */
    abstract dispose(): void;
}