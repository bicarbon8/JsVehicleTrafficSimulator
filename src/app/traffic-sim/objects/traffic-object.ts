import { Box3, Mesh, MeshStandardMaterial, Object3D, Quaternion, Texture, Vector3 } from 'three';
import { Utils } from "../helpers/utils";
import { RoadSegment } from "../map/road-segment";
import { Renderable } from "../view/renderable";
import { SimulationManager } from "../simulation-manager";
import { Body } from 'cannon-es';

export type TrafficObjectOptions = {
    id?: number;
    name?: string;
    mesh?: Mesh;
    material?: MeshStandardMaterial;
    texture?: Texture;
};

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly name: string;
    readonly simMgr: SimulationManager;

    private _obj3D: Object3D;
    private _material: MeshStandardMaterial;

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
        this._material = options?.material ?? new MeshStandardMaterial({
            color: 0xffffff, // white,
            flatShading: true
        });
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
    
    get obj3D(): Object3D {
        if (!this._obj3D) {
            this._obj3D = this.generateObj3D();
        }
        return this._obj3D;
    }

    /**
     * @returns `this.obj3D as Mesh` if it is an instance of `Mesh`,
     * otherwise `null`
     */
    get mesh(): Mesh {
        if (this.obj3D instanceof Mesh) {
            return this.obj3D as Mesh;
        }
        return null;
    }

    get body(): Body {
        return null;
    }

    get boundingBox(): Box3 {
        if (this.mesh) {
            var bbox = new Box3().setFromObject(this.mesh);
            // move to current position
            bbox.min.sub(this.mesh?.position);
            bbox.max.sub(this.mesh?.position);
            return bbox;
        }
        return null;
    }

    get material(): MeshStandardMaterial {
        return this._material;
    }

    /**
     * length of this object along the up / down vector
     */
    get height(): number {
        const size = new Vector3();
        this.boundingBox.getSize(size);
        return size.y;
    }

    /**
     * length of this object along the left / right vector
     */
    get width(): number {
        const size = new Vector3();
        this.boundingBox.getSize(size);
        return size.x;
    }

    /**
     * length of this object along the forward / backward vector
     */
    get length(): number {
        const size = new Vector3();
        this.boundingBox.getSize(size);
        return size.z;
    }

    get location(): Vector3 {
        return this.obj3D?.position.clone();
    }

    set location(location: Vector3) {
        if (location) {
            this.obj3D?.position.set(location.x, location.y, location.z);
            this.body?.position.set(location.x, location.y, location.z);
        }
        
        this._forceMeshUpdate();
    }

    get rotation(): Quaternion {
        return this.obj3D?.quaternion.clone();
    }

    set rotation(rotation: Quaternion) {
        if (rotation) {
            this.obj3D?.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
            this.body?.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    /**
     * moves this object group along it's z-axis by the specified {distance}
     * @param distance distance to move forward by
     */
    moveForwardBy(distance: number): void {
        if (distance > 0) {
            this.obj3D?.translateZ(distance);
            const loc = this.location;
            this.body?.position.set(loc.x, loc.y, loc.z);

            this._forceMeshUpdate();
        }
    }

    lookAt(location: Vector3): void {
        if (location) {
            this.obj3D?.lookAt(location);
            const q = this.rotation;
            this.body?.quaternion.set(q.x, q.y, q.z, q.w);

            this._forceMeshUpdate();
        }
    }

    disposeGeometry(): void {
        for (let m of this.obj3D?.children) {
            if (m instanceof Mesh) {
                m.geometry?.dispose();
            }
        }
        this._obj3D = null;
    }

    /**
     * let THREE know to update the mesh data because we've changed
     * this.mesh.geometry.dynamic = true;
     * this.mesh.geometry.verticesNeedUpdate = true;
     * this.mesh.geometry.normalsNeedUpdate = true;
     */
    protected _forceMeshUpdate(): void {
        this.mesh?.updateMatrix();
        this.mesh?.updateMatrixWorld();
    }

    protected abstract generateObj3D(): Object3D;

    abstract update(elapsedMs: number): void;
}