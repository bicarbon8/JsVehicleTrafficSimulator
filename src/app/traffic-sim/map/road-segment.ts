import { Line3, Vector3, LineBasicMaterial, BufferGeometry, Line, LineCurve3, SphereGeometry, MeshBasicMaterial, Object3D, Mesh } from 'three';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { TrafficObject, TrafficObjectOptions } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';

export type RoadSegmentOptions = TrafficObjectOptions & {
    start: Vector3;
    end: Vector3;
    /**
     * name of the road to which this {RoadSegment} belongs. 
     * segments on the same {roadName} are lanes that vehicles
     * can switch in to and out of
     */
    roadName?: string;
    /**
     * width of {RoadSegment} in Metres
     */
    width?: number;
    /**
     * maximum legal speed allowed on {RoadSegment} in Kilometres per Hour
     */
    speedLimit?: number;
    /**
     * indicates that this {RoadSegment} merges with other traffic so the
     * collision detection should look across a wider range
     */
    isInlet?: boolean;
}

export class RoadSegment extends TrafficObject {
    readonly id: number;
    /**
     * name of the road to which this {RoadSegment} belongs. this
     * is used in determining which lanes are available for change
     * lane manouvres
     */
    readonly roadName: string;
    /**
     * maximum legal speed allowed on {RoadSegment} in Kilometres per Hour
     */
    readonly speedLimit: number;
    /**
     * width of {RoadSegment} in Metres
     */
    readonly width: number;
    /**
     * indicates that this {RoadSegment} merges with other traffic so the
     * collision detection should look across a wider range
     */
    readonly isInlet: boolean;

    private _line: Line3;
    private _vehicles: Map<number, Vehicle>;
    private _tfcs: Map<number, TrafficFlowControl>;
    private _laneChangeLocations: Vector3[];
    private _generator: VehicleGenerator;

    constructor(options?: RoadSegmentOptions, simMgr?: SimulationManager) {
        super(options, simMgr);
        if (!options) {
            options = {start: new Vector3(0, 0, 0), end: new Vector3(0, 0, 0)};
        }
        this.roadName = options?.roadName;
        this.speedLimit = (options?.speedLimit === undefined) ? Infinity : options?.speedLimit;
        this._line = new Line3(options?.start || new Vector3(), options?.end || new Vector3());
        this.width = options?.width || 5;
        this.isInlet = options?.isInlet || false;
        this._vehicles = new Map<number, Vehicle>();
        this._tfcs = new Map<number, TrafficFlowControl>();
        this._laneChangeLocations = [];
    }

    update(elapsedMs: number): void {
        this.trafficFlowControls.forEach((tfc) => {
            tfc.update(elapsedMs);
        });
        this.vehicleGenerator?.update(elapsedMs);
        this.vehicles.forEach((veh) => {
            veh.update(elapsedMs);
        });
    }
    
    get laneChangePoints(): Vector3[] {
        return this._laneChangeLocations;
    }

    get vehicles(): Vehicle[] {
        return Array.from(this._vehicles.values());
    }

    getVehicleById(id: number): Vehicle {
        return this._vehicles.get(id);
    }

    addVehicle(vehicle: Vehicle, location?: Vector3): void {
        let loc: Vector3 = location ?? this.start;
        // console.debug(`adding vehicle '${vehicle.id}' at '${JSON.stringify(loc)}'`);
        vehicle.location = loc;
        vehicle.lookAt(this.end);
        let oldSegment: RoadSegment = vehicle.segment;
        if (oldSegment) { oldSegment.removeVehicle(vehicle.id); }
        vehicle.segmentId = this.id;
        this._vehicles.set(vehicle.id, vehicle);
    }

    removeVehicle(vehicleId: number): boolean {
        // console.debug(`removing vehicle ${vehicleId} from segment ${this.id}`);
        let v: Vehicle = this._vehicles.get(vehicleId);
        v.segmentId = -1;
        return this._vehicles.delete(vehicleId);
    }

    get trafficFlowControls(): TrafficFlowControl[] {
        return Array.from(this._tfcs.values());
    }

    addTrafficFlowControl(tfc: TrafficFlowControl, location?: Vector3): void {
        let loc: Vector3 = location || this.end;
        // console.debug(`adding tfc '${tfc.id}' with state '${tfc.getCurrentState()}' at '${JSON.stringify(loc)}' to segment '${this.id}'`);
        tfc.location = loc;
        tfc.lookAt(this.start);
        tfc.segmentId = this.id;
        this._tfcs.set(tfc.id, tfc);
    }

    removeTrafficFlowControl(tfcId: number): boolean {
        return this._tfcs.delete(tfcId);
    }

    get vehicleGenerator(): VehicleGenerator {
        return this._generator;
    }

    set vehicleGenerator(generator: VehicleGenerator) {
        // console.debug(`setting generator '${generator.id}' on segment '${this.id}'`);
        this._generator = generator;
        this._generator.segmentId = this.id;
    }

    protected generateObj3D(): Object3D {
        const lineMat = new LineBasicMaterial({color: 0x0000ff, linewidth: this.width});
        const line: Line3 = this.line;
        const geometry = new BufferGeometry().setFromPoints([line.start, line.end]);
        const obj3D: Object3D = new Line(geometry, lineMat);
        
        this._generateLaneChangePoints();

        return obj3D;
    }

    private _generateLaneChangePoints(): void {
        const point = new SphereGeometry(1);
        const pointMat = new MeshBasicMaterial();
        const sphere = new Mesh(point, pointMat);
        const spacing = 1;
        const length = this.length;
        sphere.position.set(this.start.x, this.start.y, this.start.z);
        sphere.lookAt(this.end);
        // place point every [spacing] units (metres)
        for (var i=spacing; i<length; i+=spacing) {
            sphere.translateZ(spacing);
            this._laneChangeLocations.push(sphere.position.clone());
        }
        sphere.geometry.dispose();
    }

    get start(): Vector3 {
        return this.line.start;
    }

    get end(): Vector3 {
        return this.line.end;
    }

    get line(): Line3 {
        return this._line.clone();
    }

    get length(): number {
        return this.line.distance() || 0;
    }

    get center(): Vector3 {
        const v: Vector3 = new Vector3();
        this.line.getCenter(v) ?? new Vector3();
        return v;
    }

    get tangent(): Vector3 {
        const s: LineCurve3 = new LineCurve3(this.line.start, this.line.end);
        return s.getTangent(0);
    }

    clone(): RoadSegment {
        const r = new RoadSegment({
            id: this.id,
            name: this.name,
            width: this.width,
            start: this.line.start,
            end: this.line.end,
            speedLimit: this.speedLimit
        });
        r.location = this.location;
        r.rotation = this.rotation;

        return r;
    }
}