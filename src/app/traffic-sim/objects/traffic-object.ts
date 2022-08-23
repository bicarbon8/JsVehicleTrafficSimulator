import { Box3, Material, Mesh, MeshBasicMaterial, Object3D, Quaternion, Texture, Vector3 } from 'three';
import { Renderable } from "../view/renderable";
import { MapManager } from '../map/map-manager';

export type TrafficObjectOptions = {
    id: number;
    map: MapManager;
    name?: string;
    mesh?: Mesh;
    material?: MeshBasicMaterial;
    texture?: Texture;
}

export abstract class TrafficObject implements Renderable {
    readonly id: number;
    readonly map: MapManager;
    readonly name: string;
    protected _obj3D: Object3D;
    protected _material: Material;
    protected _texture: Texture;
    #segmentId: number;

    constructor(options: TrafficObjectOptions) {
        this.id = options.id;
        this.map = options.map;
        this.name = options.name || typeof this;
        this._material = options.material || new MeshBasicMaterial({
            color: 0xffffff, // white
            wireframe: true
        });
        this._texture = options.texture || new Texture();
    }

    setSegmentId(segmentId: number): void {
        this.#segmentId = segmentId;
    }

    getSegmentId(): number {
        return this.#segmentId;
    }

    destroy(): void {
        this.map.simMgr.getViewManager().removeRenderable(this);
        this.disposeGeometry();
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
    isUpdated(): void {
        this.getObj3D()?.updateMatrix();
        this.getObj3D()?.updateMatrixWorld();
    }

    setPosition(location: Vector3): void {
        if (location) {
            this.getObj3D()?.position.set(location.x, location.y, location.z);
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

        this.isUpdated();
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