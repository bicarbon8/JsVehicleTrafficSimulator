import { Quaternion, Vector3 } from "three";
import { TrafficObject } from "./objects/traffic-object";
import { Body, Box, Vec3, World, Quaternion as Quat4, Plane } from "cannon-es";

export class PhysicsManager {
    private readonly _world: World;
    private readonly _ground: Body;
    public static GRAVITY_CONSTANT = -9.82 // m/s^2

    constructor(world?: World) {
        this._world = world ?? new World({
            gravity: new Vec3(0, PhysicsManager.GRAVITY_CONSTANT, 0)
        });
        this._ground = new Body({
            type: Body.STATIC,
            shape: new Plane(),
            position: new Vec3(0, 337, 0)
        });
        this._ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.addBody(this._ground);
    }

    update(elapsedMs: number): void {
        this._world.step(elapsedMs);
    }

    public addBody(body: Body): void {
        this._world.addBody(body);
    }

    public removeBody(body: Body): void {
        this._world.removeBody(body);
    }
}

export module PhysicsManager {
    export var inst = new PhysicsManager();
}