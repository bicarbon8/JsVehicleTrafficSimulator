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
    
    private _elapsed: number;
    private _nextVehicle: Vehicle;

    constructor(options?: VehicleGeneratorOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.delay = options?.delay || 0;
        this.roadName = options?.roadName;
        this._elapsed = 0;
    }
    
    update(elapsedMs: number): void {
        this._elapsed += elapsedMs;
        if (this._elapsed >= this.delay) {
            this.generate();
            this._elapsed = 0;
        }
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
        }
    }

    private _canAddToSegment(vehicle: Vehicle): boolean {
        let vehicles: Vehicle[] = this._simMgr.getMapManager().getVehiclesWithinRadius(vehicle, vehicle.length * 3);
        for (var i=0; i<vehicles.length; i++) {
            let v: Vehicle = vehicles[i];
            let box1: Box3 = v.getBoundingBox();
            let box2: Box3 = vehicle.getBoundingBox();
            if (Utils.isCollidingWith(box1, box2)) {
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
            acceleration: Utils.getRandomBetween(2.5, 4.5),
            deceleration: Utils.getRandomBetween(3.8, 5),
            reactionTime: Utils.getRandomBetween(2.5, 3.5),
            changeLaneDelay: Math.floor(Utils.getRandomBetween(5, 15))
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