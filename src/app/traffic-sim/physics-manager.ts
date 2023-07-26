import { Body, Vec3, World, Plane } from "cannon-es";
import { SimulationManager } from "./simulation-manager";

export class PhysicsManager {
    public static GRAVITY_CONSTANT = -9.82 // m/s^2
    
    public readonly simulationManager: SimulationManager;

    private readonly _world: World;
    private readonly _ground: Body;
    
    constructor(world?: World) {
        this._world = world ?? new World({
            gravity: new Vec3(0, PhysicsManager.GRAVITY_CONSTANT, 0),
            frictionGravity: new Vec3(0, PhysicsManager.GRAVITY_CONSTANT, 0)
        });
        this._ground = new Body({
            type: Body.STATIC,
            shape: new Plane(),
            position: new Vec3(0, 336.5, 0) // not sure why, but Y = 0 is 337 units below actual 0
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