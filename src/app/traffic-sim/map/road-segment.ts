import { Line3, Vector3, LineBasicMaterial, BufferGeometry, Line, LineCurve3, SphereGeometry, MeshBasicMaterial, Object3D, Mesh } from 'three';
import { Utils } from '../helpers/utils';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { TrafficObject, TrafficObjectOptions } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';

export type RoadSegmentOptions = TrafficObjectOptions & {
    start: Vector3;
    end: Vector3;
    /**
     * name of the road to which this `RoadSegment` belongs. 
     * segments on the same `roadName` are lanes that vehicles
     * can switch in to and out of
     */
    roadName?: string;
    /**
     * width of `RoadSegment` in Metres
     */
    width?: number;
    /**
     * maximum legal speed allowed on `RoadSegment` in Kilometres per Hour
     */
    speedLimit?: number;
    /**
     * indicates that this `RoadSegment` merges with other traffic so the
     * collision detection should look across a wider range
     */
    isInlet?: boolean;
}

export class RoadSegment extends TrafficObject {
    readonly id: number;
    /**
     * name of the road to which this `RoadSegment` belongs. this
     * is used in determining which lanes are available for change
     * lane manouvres
     */
    readonly roadName: string;
    /**
     * maximum legal speed allowed on `RoadSegment` in Kilometres per Hour
     */
    readonly speedLimit: number;
    /**
     * width of `RoadSegment` in Metres
     */
    readonly width: number;
    /**
     * indicates that this `RoadSegment` merges with other traffic so the
     * collision detection should look across a wider range
     */
    readonly isInlet: boolean;

    #line: Line3;
    #tfcIds: Array<number>;
    #laneChangeLocations: Vector3[];
    #generatorIds: Array<number>;
    #vehicleIds: Array<number>;

    constructor(options: RoadSegmentOptions, simMgr?: SimulationManager) {
        super(options);
        this.roadName = options?.roadName || Utils.guid();
        this.speedLimit = (options?.speedLimit == null) ? Infinity : options.speedLimit;
        this.#line = new Line3(options?.start || new Vector3(), options?.end || new Vector3());
        this.width = options?.width || 5;
        this.isInlet = options?.isInlet || false;
        this.#tfcIds = new Array<number>();
        this.#laneChangeLocations = new Array<Vector3>();
        this.#vehicleIds = new Array<number>();
        this.#generatorIds = new Array<number>();
    }

    update(elapsedMs: number): void {
        
    }
    
    getLaneChangePoints(): Vector3[] {
        return this.#laneChangeLocations;
    }

    get vehicleIds(): Array<number> {
        return this.#vehicleIds;
    }

    addVehicle(vehicle: Vehicle | number): this {
        if (typeof vehicle === "number") {
            this.#vehicleIds.push(vehicle);
        } else {
            this.#vehicleIds.push(vehicle.id);
        }
        return this;
    }

    removeVehicle(vehicle: Vehicle | number): this {
        let index: number;
        if (typeof vehicle === "number") {
            index = this.#vehicleIds.findIndex(vid => vid === vehicle);
        } else {
            index = this.#vehicleIds.findIndex(vid => vid === vehicle.id);
        }
        if (index >= 0) {
            this.#vehicleIds.splice(index, 1);
        }
        return this;
    }

    get tfcIds(): Array<number> {
        return this.#tfcIds;
    }

    addTfc(tfc: TrafficFlowControl | number): this {
        if (typeof tfc === "number") {
            this.#tfcIds.push(tfc);
        } else {
            this.#tfcIds.push(tfc.id);
        }
        return this;
    }

    removeTfc(tfc: TrafficFlowControl | number): this {
        let index: number;
        if (typeof tfc === "number") {
            index = this.#tfcIds.findIndex(id => id === tfc);
        } else {
            index = this.#tfcIds.findIndex(id => id === tfc.id);
        }
        if (index >= 0) {
            this.#tfcIds.splice(index, 1);
        }
        return this;
    }

    get generatorIds(): Array<number> {
        return this.#generatorIds;
    }

    addGenerator(generator: VehicleGenerator | number): this {
        if (typeof generator === "number") {
            this.#generatorIds.push(generator);
        } else {
            this.#generatorIds.push(generator.id);
        }
        return this;
    }

    removeGenerator(generator: VehicleGenerator | number): this {
        let index: number;
        if (typeof generator === "number") {
            index = this.#generatorIds.findIndex(id => id === generator);
        } else {
            index = this.#generatorIds.findIndex(id => id === generator.id);
        }
        if (index >= 0) {
            this.#generatorIds.splice(index, 1);
        }
        return this;
    }

    protected generateMesh(): Object3D {
        const lineMat = new LineBasicMaterial({color: 0x0000ff, linewidth: this.width});
        const line: Line3 = this.getLine();
        const geometry = new BufferGeometry().setFromPoints([line.start, line.end]);
        const obj3D: Object3D = new Line(geometry, lineMat);
    
        var identity: string = this.id.toString();
        if (this.name && this.name != '') {
            identity = this.name;
        }
        
        this._generateLaneChangePoints();

        return obj3D;
    }

    private _generateLaneChangePoints(): void {
        var point = new SphereGeometry(1);
        var pointMat = new MeshBasicMaterial();
        var sphere = new Mesh(point, pointMat);
        
        // place point every [spacing] units (metres)
        var spacing = 1;
        for (var i=spacing; i<this.getLength(); i+=spacing) {
            let l: Line3 = this.getLine();
            sphere.position.set(l.start.x, l.start.y, l.start.z);
            sphere.lookAt(l.end);
            sphere.translateZ(i);
            this.#laneChangeLocations.push(sphere.position.clone());
        }
        sphere.geometry.dispose();
    }

    getStart(): Vector3 {
        return this.getLine().start;
    }

    getEnd(): Vector3 {
        return this.getLine().end;
    }

    getLine(): Line3 {
        return this.#line.clone();
    }

    getLength(): number {
        return this.getLine().distance() || 0;
    }

    getCenter(): Vector3 {
        let v: Vector3 = new Vector3();
        this.getLine().getCenter(v) || new Vector3();
        return v;
    }

    getTangent(): Vector3 {
        let s: LineCurve3 = new LineCurve3(this.getLine().start, this.getLine().end);
        return s.getTangent(0);
    }

    clone(): RoadSegment {
        let r = new RoadSegment({
            id: this.id,
            map: this.map,
            name: this.name,
            width: this.width,
            start: this.getLine().start,
            end: this.getLine().end,
            speedLimit: this.speedLimit
        });
        r.setPosition(this.getLocation());
        r.setRotation(this.getRotation());

        return r;
    }
}