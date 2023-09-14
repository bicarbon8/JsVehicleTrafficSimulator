import { Body, Vec3, World, Plane, ContactMaterial, Material } from "cannon-es";
import { SimulationManager } from "./simulation-manager";

export class PhysicsManager {
    public static GRAVITY_CONSTANT = -9.82 // m/s^2
    
    public readonly simulationManager: SimulationManager;

    private readonly _world: World;
    private readonly _ground: Body;
    
    constructor(world?: World) {
        this._world = world ?? new World({
            gravity: new Vec3(0, PhysicsManager.GRAVITY_CONSTANT, 0)
        });
        this._ground = new Body({
            type: Body.STATIC,
            shape: new Plane(),
            position: new Vec3(0, 337, 0) // not sure why, but Y = 0 is 337 units below actual 0
        });
        this._ground.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2); // Rotate the plane to be horizontal
        const gMat = new Material({
            friction: 0.00001
        });
        this._ground.material = gMat;
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