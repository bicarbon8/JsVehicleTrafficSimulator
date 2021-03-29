import { TrafficObjectOptions } from "./traffic-object-options";
import { Box3, Material, Mesh, MeshBasicMaterial, Object3D, Quaternion, Texture, Vector3 } from 'three';
import { Utils } from "../helpers/utils";
import { RoadSegment } from "../map/road-segment";
import { Renderable } from "../view/renderable";
import { SimulationManager } from "../simulation-manager";

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly name: string;
    protected _obj3D: Object3D;
    protected _material: Material;
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
        mesh?.geometry.computeBoundingBox();
        return mesh?.geometry.boundingBox;
    }

    /**
     * indicate that we've updated
     * this.getMesh().geometry.dynamic = true;
     * this.getMesh().geometry.verticesNeedUpdate = true;
     * this.getMesh().geometry.normalsNeedUpdate = true;
     */
    isUpdated(): void {
        this.getObj3D()?.updateMatrix();
    }

    setPosition(location: Vector3): void {
        if (location) {
            this.getObj3D()?.position.lerp(location, 1);
        }
        
        this.isUpdated();
    }

    /**
     * moves this object along it's z-axis by the specified {distance}
     * @param distance distance to move forward by
     */
    moveForwardBy(distance: number): void {
        if (distance > 0) {
            this.getObj3D()?.translateZ(distance);
        }
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

        this.isUpdated();
    }

    getRotation(): Quaternion {
        return this.getObj3D()?.quaternion.clone();
    }

    abstract update(elapsedMs: number): void;

    disposeGeometry(): void {
        this.getMesh()?.geometry?.dispose();
    }
}