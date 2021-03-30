import { Utils } from "../../helpers/utils";
import { Vehicle } from "./vehicle";
import { Box3, Line3, Mesh } from 'three';
import { SimulationManager } from "../../simulation-manager";
import { VehicleGeneratorOptions } from "./vehicle-generator-options";
import { TrafficObject } from "../traffic-object";
import { TrafficObjectOptions } from "../traffic-object-options";
import { RoadSegment } from "../../map/road-segment";

export class VehicleGenerator extends TrafficObject {
    readonly delay: number;
    readonly roadName: string;
    readonly max: number;
    
    private _elapsed: number;
    private _nextVehicle: Vehicle;
    private _count: number;

    constructor(options?: VehicleGeneratorOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.delay = options?.delay || 0;
        this.roadName = options?.roadName;
        this.max = options?.max || Infinity;
        this._elapsed = 0;
        this._count = 0;
        this._nextVehicle = null;
    }
    
    update(elapsedMs: number): void {
        this._elapsed += elapsedMs;
        if (this._shouldGenerate()) {
            this.generate();
            this._elapsed = 0;
        }
    }

    /**
     * the number of vehicles added to the simulation
     * @returns the number of vehicles generated
     */
    getCount(): number {
        return this._count;
    }


    generate(): void {
        if (!this._nextVehicle) {
            this._nextVehicle = this._prepareNewVehicle();
        }
        
        if (this._canAddToSegment(this._nextVehicle)) {
            this.getSegment().addVehicle(this._nextVehicle);
            this._simMgr.getViewManager().addRenderable(this._nextVehicle);
            console.info(`new vehicle: '${this._nextVehicle.id}' added to segment: '${this.getSegment().id}'`);
            this._nextVehicle = null;
            this._count++;
        }
    }

    reset(): void {
        this._elapsed = 0;
        this._count = 0;
    }

    private _shouldGenerate(): boolean {
        return (this.getCount() < this.max && (this._nextVehicle != null || this._elapsed >= this.delay));
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

    private _prepareNewVehicle(): Vehicle {
        var v = new Vehicle({
            width: Utils.getRandomBetween(2, 3),
            height: Utils.getRandomBetween(1, 1.5),
            length: Utils.getRandomBetween(3, 5),
            acceleration: Utils.getRandomBetween(30000, 80000),
            deceleration: Utils.getRandomBetween(108495, 127053),
            reactionTime: Utils.getRandomBetween(2500, 3500),
            changeLaneDelay: Math.floor(Utils.getRandomBetween(5000, 15000)),
            maxVelocity: Math.floor(Utils.getRandomBetween(200, 260))
        });
        let seg: RoadSegment = this.getSegment();
        let line: Line3 = seg.getLine();
        v.setPosition(line.start);
        v.lookAt(line.end);
        return v;
    }

    protected generateMesh(): Mesh {
        /* Vehicle Generator has no mesh */
        return null;
    }
}