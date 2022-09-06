import { Utils } from "../../helpers/utils";
import { Vehicle } from "./vehicle";
import { LaneSegment } from "../../map/lane-segment";
import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";
import { ViewScene } from "../../view/view-scene";
import { PositionableSimObj, PositionableSimObjOptions } from "../positionable-sim-obj";

export type VehicleGeneratorOptions = PositionableSimObjOptions & {
    delay: number;
    max: number;
    startSpeedMax?: number;
    startSpeedMin?: number;
    laneSegment?: LaneSegment;
};

export class VehicleGenerator extends PositionableSimObj<Phaser.GameObjects.Rectangle> {
    /**
     * minimum number of milliseconds that must elapse between generating vehicles
     * NOTE: if the {RoadSegment} is blocked at its start then no vehicles will be
     * added even if this time has elapsed
     */
    readonly delay: number;
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
    
    #elapsed: number;
    #nextVehicle: Vehicle;
    #count: number;

    private _gameObj: Phaser.GameObjects.Rectangle;

    laneSegment: LaneSegment;

    constructor(options: VehicleGeneratorOptions) {
        super(options);
        this.delay = options?.delay || 0;
        this.max = options?.max || Infinity;
        this.startSpeedMax = options?.startSpeedMax || 0;
        this.startSpeedMin = options?.startSpeedMin || 0;
        this.#elapsed = 0;
        this.#count = 0;
        this.#nextVehicle = null;
    }
    
    update(time: number, delta: number): void {
        this.#elapsed += delta;
        if (this.#nextVehicle && this._canAddToSegment(this.#nextVehicle)) {
            this._addToSegment(this.#nextVehicle);
            this.#elapsed = 0;
        }
        if (this._shouldGenerate()) {
            this.#nextVehicle = this.generate();
        }
    }

    /**
     * the number of vehicles added to the simulation
     * @returns the number of vehicles generated
     */
    getCount(): number {
        return this.#count;
    }

    generate(): Vehicle {
        this.#count++;
        const seg: LaneSegment = this.laneSegment;
        var v = new Vehicle({
            simulation: this.sim,
            location: this.location,
            width: Utils.getRandomFloat(TrafficSimConstants.Vehicles.Width.min, TrafficSimConstants.Vehicles.Width.max),
            length: Utils.getRandomFloat(TrafficSimConstants.Vehicles.Length.min, TrafficSimConstants.Vehicles.Length.max),
            acceleration: Utils.getRandomFloat(TrafficSimConstants.Vehicles.Acceleration.min, TrafficSimConstants.Vehicles.Acceleration.max),
            deceleration: Utils.getRandomFloat(TrafficSimConstants.Vehicles.Deceleration.min, TrafficSimConstants.Vehicles.Deceleration.max),
            reactionTime: Utils.getRandomFloat(TrafficSimConstants.Vehicles.ReactionTime.min, TrafficSimConstants.Vehicles.ReactionTime.max),
            changeLaneDelay: Utils.getRandomFloat(TrafficSimConstants.Vehicles.ChangeLaneDelay.min, TrafficSimConstants.Vehicles.ChangeLaneDelay.max),
            maxSpeed: Math.floor(Utils.getRandomFloat(200, 260))
        });
        v.gameObj.setVisible(false);
        v.lookAt(seg.end);
        return v;
    }

    reset(): void {
        this.#elapsed = 0;
        this.#count = 0;
    }

    private _shouldGenerate(): boolean {
        return (!this.#nextVehicle
            && this.getCount() < this.max
            && this.#elapsed >= this.delay);
    }

    private _canAddToSegment(vehicle: Vehicle): boolean {
        const segment: LaneSegment = this.laneSegment;
        const vehicles: Vehicle[] = segment.roadMap.getVehiclesWithinRadius(vehicle, TrafficSimConstants.Vehicles.Length.max);
        for (var i=0; i<vehicles.length; i++) {
            let v: Vehicle = vehicles[i];
            if (this.scene.physics.overlap(vehicle.gameObj, v.gameObj)) {
                return false;
            }
        }

        return true;
    }

    private _addToSegment(vehicle: Vehicle): void {
        const segment: LaneSegment = this.laneSegment;
        segment.addVehicle(this.#nextVehicle, this.location);
        this.#nextVehicle.gameObj.setVisible(true);
        this.#nextVehicle = null;
    }
    
    get gameObj(): Phaser.GameObjects.Rectangle {
        if (!this._gameObj) {
            this._gameObj = this.scene.add.rectangle(0, 0, this.width, this.length, 0x666666, 0);
            this._gameObj.setVisible(false);
        }
        return this._gameObj;
    }

    dispose(): void {
        this.laneSegment.removeGenerator(this);
        this.laneSegment = null;
        this.scene.children.remove(this.gameObj);
        this.gameObj.destroy();
    }
}