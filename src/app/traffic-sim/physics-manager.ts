import "@babylonjs/core/Physics/physicsEngineComponent";
import { PhysicsEngine } from "@babylonjs/core/Physics/physicsEngine";
import { SimulationManager } from "./simulation-manager";
import { Mesh, MeshBuilder } from "@babylonjs/core";

export class PhysicsManager {
    public static GRAVITY_CONSTANT = -9.82 // m/s^2
    
    public readonly simulationManager: SimulationManager;

    private readonly _world: boolean | PhysicsEngine;
    private readonly _ground: Mesh;
    
    constructor(simMgr: SimulationManager, world?: PhysicsEngine) {
        this.simulationManager = simMgr;
        this.simulationManager.viewManager.scene.enablePhysics();
        // this._ground = MeshBuilder.CreateGround('ground', {}, this.simulationManager.viewManager.scene);
    }

    update(elapsedMs: number): void {
        // const elapsedSeconds = elapsedMs / 1000;
        // let subSteps: number = 1;
        // if (elapsedSeconds > (1/60)) {
        //     subSteps = Math.ceil(elapsedSeconds / (1/60));
        // }
        // this._world.step(elapsedSeconds, null, subSteps);
    }

    // public addBody(body: Body): void {
    //     this._world.addBody(body);
    // }

    // public removeBody(body: Body): void {
    //     this._world.removeBody(body);
    // }
}