import { TrafficObjectOptions } from "./traffic-object-options";
import { Box3,  Mesh, MeshBasicMaterial, Quaternion, Texture, Vector3 } from 'three';
import { Utils } from "../helpers/utils";
import { RoadSegment } from "../map/road-segment";
import { Renderable } from "../view/renderable";
import { SimulationManager } from "../simulation-manager";

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly name: string;
    protected _mesh: Mesh;
    protected _material: MeshBasicMaterial;
    protected _texture: Texture;
    protected _segmentId: number;
    protected _simMgr: SimulationManager;

    constructor(options?: TrafficObjectOptions, simMgr?: SimulationManager) {
        this._simMgr = simMgr || SimulationManager.inst;
        this.id = options?.id || Utils.getNewId();
        this.name = options?.name || typeof this;
        this._material = options?.material || new MeshBasicMaterial({
            color: 0xffffff, // white
            wireframe: true
        });
        this._texture = options?.texture || new Texture();
    }

    setSegmentId(segmentId: number): void {
        this._segmentId = segmentId;
    }

    getSegmentId(): number {
        return this._segmentId;
    }

    getSegment(): RoadSegment {
        return this._simMgr.getMapManager().getSegmentById(this._segmentId);
    }
    
    protected abstract generateMesh(): Mesh;

    getMesh(): Mesh {
        if (!this._mesh) {
            this._mesh = this.generateMesh();
        }
        return this._mesh;
    }

    getBoundingBox(): Box3 {
        this.getMesh()?.geometry.computeBoundingBox();
        return this.getMesh()?.geometry.boundingBox;
    }

    /**
     * indicate that we've updated
     * this.getMesh().geometry.dynamic = true;
     * this.getMesh().geometry.verticesNeedUpdate = true;
     * this.getMesh().geometry.normalsNeedUpdate = true;
     */
    isUpdated(): void {
        this.getMesh()?.updateMatrix();
    }

    moveTo(location: Vector3): void {
        if (location) {
            this.getMesh()?.position.set(location.x, location.y, location.z);
        }
        
        this.isUpdated();
    }

    getLocation(): Vector3 {
        return this.getMesh()?.position.clone();
    }

    setRotation(rotation: Quaternion): void {
        if (rotation) {
            this.getMesh()?.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
        }
    }

    lookAt(location: Vector3): void {
        if (location) {
            this.getMesh()?.lookAt(location);
        }

        this.isUpdated();
    }

    getRotation(): Quaternion {
        return this.getMesh()?.quaternion.clone();
    }

    /**
     * moves this object along it's z-axis by the specified {distance}
     * @param distance distance to move forward by
     */
    moveBy(distance: number): void {
        if (distance > 0) {
            this.getMesh()?.translateZ(distance);
        }
    }

    abstract update(elapsedMs?: number): void;

    disposeGeometry(): void {
        this.getMesh()?.geometry?.dispose();
    }
}