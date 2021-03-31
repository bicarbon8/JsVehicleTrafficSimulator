import { Utils } from "../../helpers/utils";
import { Vehicle } from "./vehicle";
import { Line3, Mesh } from 'three';
import { SimulationManager } from "../../simulation-manager";
import { VehicleGeneratorOptions } from "./vehicle-generator-options";
import { TrafficObject } from "../traffic-object";
import { TrafficObjectOptions } from "../traffic-object-options";
import { RoadSegment } from "../../map/road-segment";

export class VehicleGenerator extends TrafficObject {
    /**
     * minimum number of milliseconds that must elapse between generating vehicles
     * NOTE: if the {RoadSegment} is blocked at its start then no vehicles will be
     * added even if this time has elapsed
     */
    readonly delay: number;
    readonly roadName: string;
    /**
     * maximum number of vehicles to generate
     */
    readonly max: number;
    /**
     * maximum starting speed in Metres per Second for generated vehicles
     */
    readonly startSpeedMax: number;
    /**
     * minimum starting speed in Metres per Second for generated vehicles
     */
    readonly startSpeedMin: number;
    
    private _elapsed: number;
    private _nextVehicle: Vehicle;
    private _count: number;

    constructor(options?: VehicleGeneratorOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.delay = options?.delay || 0;
        this.roadName = options?.roadName;
        this.max = options?.max || Infinity;
        this.startSpeedMax = options?.startSpeedMax || 0;
        this.startSpeedMin = options?.startSpeedMin || 0;
        this._elapsed = 0;
        this._count = 0;
        this._nextVehicle = null;
    }
    
    update(elapsedMs: number): void {
        this._elapsed += elapsedMs;
        if (this._nextVehicle && this._canAddToSegment(this._nextVehicle)) {
            this._addToSegment(this._nextVehicle);
            this._elapsed = 0;
        }
        if (this._shouldGenerate()) {
            this._nextVehicle = this.generate();
        }
    }

    /**
     * the number of vehicles added to the simulation
     * @returns the number of vehicles generated
     */
    getCount(): number {
        return this._count;
    }


    generate(): Vehicle {
        this._count++;
        var v = new Vehicle({
            width: Utils.getRandomBetween(2, 3),
            height: Utils.getRandomBetween(1, 1.5),
            length: Utils.getRandomBetween(3, 5),
            acceleration: Utils.getRandomBetween(2.78, 6.95), // 0-100 in 4 to 10 seconds
            deceleration: Utils.getRandomBetween(6.94, 10.15), // 100-0 in 2.7 to 4 seconds
            reactionTime: Utils.getRandomBetween(2500, 3500),
            changeLaneDelay: Math.floor(Utils.getRandomBetween(5000, 15000)),
            maxSpeed: Math.floor(Utils.getRandomBetween(200, 260)),
            startingVelocity: Utils.getRandomBetween(this.startSpeedMin, this.startSpeedMax)
        });
        let seg: RoadSegment = this.getSegment();
        let line: Line3 = seg.getLine();
        v.setPosition(line.start);
        v.lookAt(line.end);
        return v;
    }

    reset(): void {
        this._elapsed = 0;
        this._count = 0;
    }

    private _shouldGenerate(): boolean {
        return (!this._nextVehicle
            && this.getCount() < this.max
            && this._elapsed >= this.delay);
    }

    private _canAddToSegment(vehicle: Vehicle): boolean {
        let segment: RoadSegment = this.getSegment();
        let vehicles: Vehicle[] = this._simMgr.getMapManager().getVehiclesWithinRadiusAhead(segment.getLine().start, segment, vehicle.length * 3);
        for (var i=0; i<vehicles.length; i++) {
            let v: Vehicle = vehicles[i];
            if (Utils.isCollidingWith(vehicle, v)) {
                return false;
            }
        }

        return true;
    }

    private _addToSegment(vehicle: Vehicle): void {
        this.getSegment().addVehicle(this._nextVehicle);
        this._simMgr.getViewManager().addRenderable(this._nextVehicle);
        console.info(`new vehicle: '${this._nextVehicle.id}' added to segment: '${this.getSegment().id}'`);
        this._nextVehicle = null;
    }

    protected generateMesh(): Mesh {
        /* Vehicle Generator has no mesh */
        return null;
    }
}