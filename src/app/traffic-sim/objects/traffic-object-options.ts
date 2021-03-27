import { Mesh, MeshBasicMaterial, Texture } from 'three';

export interface TrafficObjectOptions {
    id?: number;
    name?: string;
    mesh?: Mesh;
    material?: MeshBasicMaterial;
    texture?: Texture;
}