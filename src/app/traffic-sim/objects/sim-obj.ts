import { Utils } from '../helpers/utils';
import { Disposable } from '../interfaces/disposable';
import { Updatable } from '../interfaces/updatable';
import { TrafficSim } from '../view/traffic-sim';

export type SimObjOptions = {
    simulation: TrafficSim;
    id?: string;
    name?: string;
}

export abstract class SimObj implements Updatable, Disposable {
    readonly sim: TrafficSim;
    readonly id: string;
    readonly name: string;

    constructor(options: SimObjOptions) {
        this.sim = options.simulation || TrafficSim.inst;
        this.id = Utils.guid();
        this.name = options.name || typeof this;
    }

    /** Updatable */
    abstract update(time: number, delta: number): void;

    /** Disposable */
    abstract dispose(): void;
}