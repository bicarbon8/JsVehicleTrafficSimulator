import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { TrafficObject, TrafficObjectOptions } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';
import { Utils } from '../helpers/utils';
import { Axis, Mesh, MeshBuilder, Path3D, Space, Vector3 } from "@babylonjs/core";
import { V3 } from '../helpers/customTypes';

export type RoadSegmentOptions = TrafficObjectOptions & {
    start: V3;
    end: V3;
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
     * height of {RoadSegment} in Metres
     */
    height?: number;
    /**
     * maximum legal speed allowed on {RoadSegment} in Metres per Second
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
     * maximum legal speed allowed on {RoadSegment} in Metres per Second
     */
    readonly speedLimit: number;
    /**
     * width of {RoadSegment} in Metres
     */
    private _width: number;
    /**
     * height of {RoadSegment} in Metres
     */
    private _height: number;
    /**
     * indicates that this {RoadSegment} merges with other traffic so the
     * collision detection should look across a wider range
     */
    readonly isInlet: boolean;

    private _line: Path3D;
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
        this._line = new Path3D([V3.toVector3(options.start), V3.toVector3(options.end)]);
        this._width = options?.width ?? 6; // standard US lane width = 3.7
        this._height = options?.height ?? 0.5;
        this.isInlet = options?.isInlet ?? false;
        this._vehicles = new Map<number, Vehicle>();
        this._tfcs = new Map<number, TrafficFlowControl>();
        this._laneChangeLocations = [];
        this.hasPhysics = true;
    }

    /**
     * length of this object along the up / down vector
     */
    get height(): number {
        return this._height;
    }

    /**
     * length of this object along the left / right vector
     */
    get width(): number {
        return this._width;
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

    /**
     * removes the supplied `Vehicle` from any current `RoadSegment` and then adds it
     * to this one making sure to set it's heading towards the end point.
     * @param vehicle the `Vehicle` to add to this `RoadSegment`
     * @param location an optional `Vector3` used to position the `Vehicle` @default `this.start`
     */
    addVehicle(vehicle: Vehicle, location?: Vector3): void {
        // console.debug(`adding vehicle '${vehicle.id}' at '${JSON.stringify(loc)}'`);
        let oldSegment: RoadSegment = vehicle.segment;
        if (oldSegment) { oldSegment.removeVehicle(vehicle.id); }
        vehicle.segmentId = this.id;
        this._vehicles.set(vehicle.id, vehicle);
        if (location) {
            vehicle.location = location;
        }
    }

    /**
     * removes the `Vehicle` associated with the supplied id from this `RoadSegment`
     * also setting the `Vehicle.segmentId` to `-1`
     * @param vehicleId the id of the `Vehicle` to remove
     * @returns `true` if successfully removed, otherwise `false`
     */
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

    protected generateObj3D(): Mesh {
        const length = this.length;
        const centre = this.center
        
        const mesh = MeshBuilder.CreateBox(this.name, {width: this._width, height: this._height, depth: length}, this.simMgr.viewManager.scene);
        mesh.position.set(centre.x, centre.y - this._height, centre.z);
        const look = this.end;
        look.y -= this._height;
        mesh.lookAt(look);
        this._generateLaneChangePoints();
        return mesh;
    }

    private _generateLaneChangePoints(): void {
        const sphere = MeshBuilder.CreateSphere(`tmp`, {}, this.simMgr.viewManager.scene);
        const spacing = 1;
        const length = this.length;
        sphere.position.set(this.start.x, this.start.y, this.start.z);
        sphere.lookAt(this.end);
        // place point every [spacing] units (metres)
        for (var i=spacing; i<length; i+=spacing) {
            sphere.translate(Axis.Z, spacing, Space.LOCAL);
            this._laneChangeLocations.push(sphere.position.clone());
        }
        sphere.dispose();
    }

    get start(): Vector3 {
        return this._line.getPointAt(0).clone();
    }

    get end(): Vector3 {
        return this._line.getPointAt(1).clone();
    }

    get line(): Path3D {
        return new Path3D([...this._line.getPoints().map(p => p.clone())]);
    }

    get length(): number {
        return this._line?.getDistanceAt(0) ?? 0;
    }

    get center(): Vector3 {
        const v: Vector3 = Utils.getPointInBetweenByPercent(this.start, this.end, 0.5);
        return v;
    }

    get tangent(): Vector3 {
        return this._line.getTangentAt(0);
    }

    clone(): RoadSegment {
        const r = new RoadSegment({
            id: this.id,
            name: this.name,
            width: this.width,
            start: this.start,
            end: this.end,
            speedLimit: this.speedLimit
        });
        r.location = this.location;
        r.rotation = this.rotation;

        return r;
    }
}