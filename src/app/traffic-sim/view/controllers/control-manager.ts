import { Controllable } from "../../interfaces/controllable";
import { Updatable } from "../../interfaces/updatable";
import { RoadmapScene } from "../scenes/roadmap-scene";

export abstract class ControlManager implements Updatable {
    #scene: Phaser.Scene;
    #controllables: Array<Controllable>;
    
    active: boolean;

    constructor(scene: RoadmapScene, ...controllables: Array<Controllable>) {
        this.#scene = scene;
        this.#controllables = controllables || new Array<Controllable>();
        this.active = true;
    }

    get game(): Phaser.Game {
        return this.scene?.game;
    }

    get scene(): Phaser.Scene {
        return this.#scene;
    }

    get controllables(): Array<Controllable> {
        return this.#controllables;
    }

    addControllable(controllable: Controllable): this {
        this.#controllables.push(controllable);
        return this;
    }

    removeControllable(controllable: Controllable): Controllable {
        const index = this.#controllables.findIndex(c => c === controllable);
        if (index >= 0) {
            return this.#controllables.splice(index, 1)[0];
        }
        return null;
    }

    abstract update(time: number, delta: number): void;
}