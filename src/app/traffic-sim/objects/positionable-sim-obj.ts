import { TrafficSimConstants } from "../helpers/traffic-sim-constants";
import { Utils } from "../helpers/utils";
import { GameObj, V2 } from "../interfaces/custom-types";
import { GameObject } from "../interfaces/game-object";
import { Positionable } from "../interfaces/positionable";
import { SimObj, SimObjOptions } from "./sim-obj";

export type PositionableSimObjOptions = SimObjOptions & {
    length?: number;
    width?: number;
    location?: V2;
    rotation?: number;
};

export abstract class PositionableSimObj<T extends GameObj> extends SimObj implements GameObject<T>, Positionable {
    constructor(options: PositionableSimObjOptions) {
        super(options);
        this.length = options.length || 1;
        this.width = options.width || 1;
        this.setLocation(options.location)
            .setRotation(options.rotation);
    }

    /** Positionable */

    readonly length: number;
    readonly width: number;
    get location(): V2 {
        return {x: this.gameObj.x, y: this.gameObj.y};
    }
    /** rotation in Radians */
    get rotation(): number {
        return this.gameObj.rotation;
    }
    get heading(): V2 {
        return Utils.getHeading(this.rotation);
    }
    setLocation(loc: V2): this {
        if (loc) {
            this.gameObj.setPosition(loc.x, loc.y);
        }
        return this;
    }
    /** rotation in Radians */
    setRotation(rot: number): this {
        if (rot) {
            this.gameObj.setRotation(rot);
        }
        return this;
    }
    setHeading(heading: V2): this {
        if (heading) {
            const p1 = heading;
            const p2 = Utils.vector2(heading).multiply({x: 2, y: 2});
            const angle = Phaser.Math.Angle.BetweenPoints(p1, p2);
            this.setRotation(Utils.deg2rad(angle));
        }
        return this;
    }

    /** GameObject */
    abstract get gameObj(): T;
    get scene(): Phaser.Scene {
        return this.sim.game.scene.getScene(TrafficSimConstants.UI.Scenes.roadmapScene);
    }
}