import { Box3, Material, Mesh, MeshBasicMaterial, Object3D, Quaternion, Texture, Vector3 } from 'three';
import { Utils } from "../helpers/utils";
import { RoadSegment } from "../map/road-segment";
import { Renderable } from "../view/renderable";
import { SimulationManager } from "../simulation-manager";

export type TrafficObjectOptions = {
    id?: number;
    name?: string;
    mesh?: Mesh;
    material?: MeshBasicMaterial;
    texture?: Texture;
};

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly name: string;
    readonly simMgr: SimulationManager;

    protected _obj3D: Object3D;
    protected _material: Material;
    protected _texture: Texture;

    /**
     * the `id` of the `RoadSegment` on which this `TrafficObject` is placed
     */
    public segmentId: number;
    
    constructor(options?: TrafficObjectOptions, simMgr?: SimulationManager) {
        this.simMgr = simMgr ?? SimulationManager.inst;
        this.id = options?.id ?? Utils.getNewId();
        this.name = options?.name ?? `${this.constructor.name}-${this.id}`;
        this._material = options?.material ?? new MeshBasicMaterial({
            color: 0xffffff, // white
            wireframe: true
        });
        this._texture = options?.texture ?? new Texture();
    }

    /**
     * performs a lookup in the `MapManager` of this object's `SimulationManager`
     * for the `RoadSegment` referenced by this object's `segmentId`. this is a
     * fast lookup because the `MapManager` uses a hashmap to store all the
     * `RoadSegments` by id
     */
    get segment(): RoadSegment {
        return this.simMgr.getMapManager().getSegmentById(this.segmentId);
    }
    
    protected abstract generateMesh(): Object3D;

    getObj3D(): Object3D {
        if (!this._obj3D) {
            this._obj3D = this.generateMesh();
        }
        return this._obj3D;
    }

    getMesh(): Mesh {
        let obj: Object3D = this.getObj3D();
        if (obj instanceof Mesh) {
            return obj as Mesh;
        }
        return null;
    }

    getBoundingBox(): Box3 {
        let mesh = this.getMesh();
        var bbox = new Box3().setFromObject(mesh);
        bbox.min.sub(mesh?.position);
        bbox.max.sub(mesh?.position);
        return bbox;
    }

    getMaterial(): MeshBasicMaterial {
        return this.getMesh().material as MeshBasicMaterial;
    }

    /**
     * indicate that we've updated
     * this.getMesh().geometry.dynamic = true;
     * this.getMesh().geometry.verticesNeedUpdate = true;
     * this.getMesh().geometry.normalsNeedUpdate = true;
     */
    forceUpdate(): void {
        this.getObj3D()?.updateMatrix();
        this.getObj3D()?.updateMatrixWorld();
    }

    setPosition(location: Vector3): void {
        if (location) {
            this.getObj3D()?.position.set(location.x, location.y, location.z);
        }
        
        this.forceUpdate();
    }

    /**
     * moves this object along it's z-axis by the specified {distance}
     * @param distance distance to move forward by
     */
    moveForwardBy(distance: number): void {
        if (distance > 0) {
            this.getObj3D()?.translateZ(distance);
        }

        this.forceUpdate();
    }

    getLocation(): Vector3 {
        return this.getObj3D()?.position.clone();
    }

    setRotation(rotation: Quaternion): void {
        if (rotation) {
            this.getObj3D()?.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    lookAt(location: Vector3): void {
        if (location) {
            this.getObj3D()?.lookAt(location);
        }

        this.forceUpdate();
    }

    getRotation(): Quaternion {
        return this.getObj3D()?.quaternion.clone();
    }

    abstract update(elapsedMs: number): void;

    disposeGeometry(): void {
        this.getMesh()?.geometry?.dispose();
    }
}