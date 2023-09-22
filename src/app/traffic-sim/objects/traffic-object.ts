import { Utils } from "../helpers/utils";
import { RoadSegment } from "../map/road-segment";
import { Renderable } from "../view/renderable";
import { SimulationManager } from "../simulation-manager";
import { BoundingBlock, BoundingInfo, Material, Mesh, PhysicsBody, Quaternion, Space, Vector3 } from "babylonjs";

export type TrafficObjectOptions = {
    id?: number;
    name?: string;
    mesh?: Mesh;
    material?: Material;
    // texture?: Texture;
};

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly name: string;
    readonly simMgr: SimulationManager;

    private _mesh: Mesh;
    private _material: Material;
    private _previousLoc: Vector3;
    private _velocity: Vector3;

    /**
     * the `id` of the `RoadSegment` on which this `TrafficObject` is placed
     */
    public segmentId: number;
    /**
     * indicates if this object is subjected to physics simulation (collisions,
     * gravity)
     */
    public hasPhysics: boolean;
    
    constructor(options?: TrafficObjectOptions, simMgr?: SimulationManager) {
        this.simMgr = simMgr ?? SimulationManager.inst;
        this.id = options?.id ?? Utils.getNewId();
        this.name = options?.name ?? `${this.constructor.name}-${this.id}`;
        this._material = options?.material ?? new Material('material1', this.simMgr.viewManager.scene);
        // {
        //     color: 0xffffff, // white,
        //     flatShading: true
        // });
        this._velocity = new Vector3();
    }

    /**
     * performs a lookup in the `MapManager` of this object's `SimulationManager`
     * for the `RoadSegment` referenced by this object's `segmentId`. this is a
     * fast lookup because the `MapManager` uses a hashmap to store all the
     * `RoadSegments` by id
     */
    get segment(): RoadSegment {
        return this.simMgr.mapManager.getSegmentById(this.segmentId);
    }
    
    get mesh(): Mesh {
        if (!this._mesh) {
            this._mesh = this.generateObj3D();
        }
        return this._mesh;
    }

    get body(): PhysicsBody {
        return this.mesh?.physicsBody;
    }

    get boundingBox(): BoundingInfo {
        if (this.mesh) {
            var bbox = this.mesh.getBoundingInfo();
            return bbox;
        }
        return null;
    }

    get material(): Material {
        return this.mesh.material;
    }

    get location(): Vector3 {
        return this.mesh?.position.clone();
    }

    set location(location: Vector3) {
        if (location) {
            this.mesh?.position.set(location.x, location.y, location.z);
        }
        
        this._forceMeshUpdate();
    }

    get rotation(): Quaternion {
        return this.mesh?.rotationQuaternion.clone();
    }

    set rotation(rotation: Quaternion) {
        if (rotation) {
            this.mesh?.rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    get velocity(): Vector3 {
        return this._velocity.clone();
    }

    /**
     * moves this object group along it's z-axis by the specified {distance}
     * @param distance distance to move forward by
     */
    moveForwardBy(distance: number): void {
        if (distance > 0) {
            this.mesh?.translate(new Vector3(0, 0, 1), distance, Space.LOCAL);
            const loc = this.location;

            this._forceMeshUpdate();
        }
    }

    lookAt(location: Vector3): void {
        if (location) {
            this.mesh?.lookAt(location);
            const q = this.rotation;

            this._forceMeshUpdate();
        }
    }

    disposeGeometry(): void {
        for (let m of this.mesh?.getChildMeshes()) {
            if (m instanceof Mesh) {
                m.geometry?.dispose();
            }
        }
        this._mesh = null;
    }

    /**
     * let THREE know to update the mesh data because we've changed
     * this.mesh.geometry.dynamic = true;
     * this.mesh.geometry.verticesNeedUpdate = true;
     * this.mesh.geometry.normalsNeedUpdate = true;
     */
    protected _forceMeshUpdate(): void {
        // this.mesh?.updateMatrix();
        // this.mesh?.updateMatrixWorld();
    }

    protected abstract generateObj3D(): Mesh;

    update(elapsedMs: number): void {
        const loc = this.location;
        this._previousLoc ??= loc.clone();
        const seconds = elapsedMs / 1000;
        this._velocity = loc.subtract(this._previousLoc).divide(new Vector3(seconds, seconds, seconds)); // m/s
    }
}