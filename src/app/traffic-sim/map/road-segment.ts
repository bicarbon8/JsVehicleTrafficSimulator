import { Line3, Vector3, LineBasicMaterial, BufferGeometry, Line, LineCurve3, SphereGeometry, MeshBasicMaterial, Object3D, Mesh } from 'three';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { TrafficObject } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';
import { RoadSegmentOptions } from './road-segment-options';

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
        this.getTfcs().forEach((tfc) => {
            tfc.update(elapsedMs);
        });
        this.getVehicleGenerator()?.update(elapsedMs);
        this.getVehicles().forEach((veh) => {
            veh.update(elapsedMs);
        });
    }
    
    getLaneChangePoints(): Vector3[] {
        return this._laneChangeLocations;
    }

    getVehicles(): Vehicle[] {
        return Array.from(this._vehicles.values());
    }

    getVehicleById(id: number): Vehicle {
        return this._vehicles.get(id);
    }

    addVehicle(vehicle: Vehicle, location?: Vector3): void {
        let l: Line3 = this.getLine();
        let loc: Vector3 = location || l.start;
        // console.debug(`adding vehicle '${vehicle.id}' at '${JSON.stringify(loc)}'`);
        vehicle.setPosition(loc);
        vehicle.lookAt(l.end);
        let oldSegment: RoadSegment = vehicle.getSegment();
        if (oldSegment) { oldSegment.removeVehicle(vehicle.id); }
        vehicle.setSegmentId(this.id);
        this._vehicles.set(vehicle.id, vehicle);
    }

    removeVehicle(vehicleId: number): boolean {
        // console.debug(`removing vehicle ${vehicleId} from segment ${this.id}`);
        let v: Vehicle = this._vehicles.get(vehicleId);
        v.setSegmentId(-1);
        return this._vehicles.delete(vehicleId);
    }

    getTfcs(): TrafficFlowControl[] {
        return Array.from(this._tfcs.values());
    }

    addTfc(tfc: TrafficFlowControl, location?: Vector3): void {
        let l: Line3 = this.getLine();
        let loc: Vector3 = location || l.end;
        // console.debug(`adding tfc '${tfc.id}' with state '${tfc.getCurrentState()}' at '${JSON.stringify(loc)}' to segment '${this.id}'`);
        tfc.setPosition(loc);
        tfc.lookAt(l.start);
        tfc.setSegmentId(this.id);
        this._tfcs.set(tfc.id, tfc);
    }

    removeTfc(tfcId: number): boolean {
        return this._tfcs.delete(tfcId);
    }

    getVehicleGenerator(): VehicleGenerator {
        return this._generator;
    }

    setVehicleGenerator(generator: VehicleGenerator): void {
        // console.debug(`setting generator '${generator.id}' on segment '${this.id}'`);
        this._generator = generator;
        this._generator.setSegmentId(this.id);
    }

    protected generateMesh(): Object3D {
        let lineMat = new LineBasicMaterial({color: 0x0000ff, linewidth: this.width});
        let line: Line3 = this.getLine();
        var geometry = new BufferGeometry().setFromPoints([line.start, line.end]);
        let obj3D: Object3D = new Line(geometry, lineMat);
    
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
            this._laneChangeLocations.push(sphere.position.clone());
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
        return this._line.clone();
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