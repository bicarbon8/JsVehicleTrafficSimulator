import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { TrafficFlowControl } from "../traffic-controls/traffic-flow-control";
import { Vehicle, VehicleState } from "./vehicle";

export class VehicleDecisionEngine {
    private readonly _vehicle: Vehicle;

    constructor(vehicle: Vehicle) {
        this._vehicle = vehicle;
    }

    public getDesiredState(): VehicleState {
        if (this._vehicle.isCrashed()) {
            return this.getCrashedDesiredState();
        }
        switch (this._vehicle.state) {
            case 'stopped':
                return this.getStoppedDesiredState();
            case 'accelerating':
                return this.getAcceleratingDesiredState();
            case 'decelerating':
                return this.getDeceleratingDesiredState();
            case 'changinglane':
                return this.getAcceleratingDesiredState();
            default:
                return this._vehicle.state;
        }
    }

    public getStoppedDesiredState(): VehicleState {
        const vehicles = this.vehiclesAhead();
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped')) {
                return 'stopped';
            }
        }

        const tfcs = this.tfcsAhead();
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(this._vehicle))) {
                return 'stopped';
            }
        }

        return 'accelerating';
    }

    public getAcceleratingDesiredState(): VehicleState {
        const vehicles = this.vehiclesAhead();
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped' || this.isVehicleSlower(v))) {
                if (this._vehicle.canChangeLanes()) {
                    if (this.shouldChangeLanes()) {
                        return 'changinglane';
                    }
                }
                return 'decelerating';
            }
        }

        const tfcs = this.tfcsAhead();
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(this._vehicle))) {
                return 'decelerating';
            }
        }

        const segments = this.segmentsAhead();
        if (segments.length > 0) {
            if (segments.some(s => this._vehicle.speed > Utils.corneringSpeedCalculator(Utils.angleFormedBy(this._vehicle.segment.line, s.line)))) {
                return 'decelerating';
            }
        }

        if (this.isAboveSpeedLimit() || this.isAboveMaxSpeed()) {
            return 'decelerating';
        }

        return 'accelerating';
    }

    public getDeceleratingDesiredState(): VehicleState {
        const vehicles = this.vehiclesAhead();
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped' || this.isVehicleSlower(v))) {
                if (this._vehicle.canChangeLanes()) {
                    if (this.shouldChangeLanes()) {
                        return 'changinglane';
                    }
                }
                if (this.isNearlyStopped()) {
                    return 'stopped';
                }
                return 'decelerating';
            }
        }

        const tfcs = this.tfcsAhead();
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(this._vehicle))) {
                if (this.isNearlyStopped()) {
                    return 'stopped';
                }
                return 'decelerating';
            }
        }

        const segments = this.segmentsAhead();
        if (segments.length > 0) {
            if (segments.some(s => this._vehicle.speed > Utils.corneringSpeedCalculator(Utils.angleFormedBy(this._vehicle.segment.line, s.line)))) {
                return 'decelerating';
            }
        }

        if (this.isAboveSpeedLimit() || this.isAboveMaxSpeed()) {
            return 'decelerating';
        }

        return 'accelerating';
    }

    public shouldChangeLanes(): boolean {
        const similar = this._vehicle.simMgr.mapManager.getSimilarSegmentsInRoad(this._vehicle.segment);
        return similar.some(s => {
            // if vehicles ahead on new lanes
            const vehs = this.vechiclesAheadOn(s);
            // and if those vehicles are stopped or slower
            if (vehs.some(v => v.state === 'stopped' || this.isVehicleSlower(v))) {
                // don't change lanes
                return false;
            }
            // otherwise change lanes
            return true;
        });
    }

    public getCrashedDesiredState(): VehicleState {
        if (this.isNearlyStopped()) {
            return 'stopped';
        }
        return 'decelerating';
    }

    public vehiclesAhead(): Array<Vehicle> {
        const ahead = this._vehicle.simMgr.mapManager.getVehiclesWithinRadius(this._vehicle, this._vehicle.getLookAheadDistance())
            .filter(v => this._vehicle.hasInViewAhead(v));

        return ahead;
    }

    public vechiclesAheadOn(segment: RoadSegment): Array<Vehicle> {
        const ahead = this._vehicle.simMgr.mapManager.getVehiclesWithinRadius(this._vehicle, this._vehicle.getLookAheadDistance())
            .filter(v => v.segmentId === segment.id);

        return ahead;
    }

    public tfcsAhead(): Array<TrafficFlowControl> {
        const ahead = this._vehicle.simMgr.mapManager.getTfcsWithinRadiusAhead(this._vehicle.location, this._vehicle.segment, this._vehicle.getLookAheadDistance());

        return ahead;
    }

    public segmentsAhead(): Array<RoadSegment> {
        const ahead = new Array<RoadSegment>();
        let remainingDist = this._vehicle.getLookAheadDistance();
        let pos = this._vehicle.location;
        let segment = this._vehicle.segment;
        while (segment && remainingDist > 0) {
            ahead.push(segment);
            const dist = Utils.getLength(pos, segment.end);
            remainingDist -= dist;
            if (remainingDist > 0) {
                const nextSegments = this._vehicle.simMgr.mapManager.getSegmentsStartingAt(segment.end);
                if (nextSegments?.length) {
                    segment = nextSegments[Utils.getRandomIntBetween(0, nextSegments.length)];
                    pos = segment.start;
                } else {
                    segment = null;
                }
            } else {
                segment = null;
            }
        }
        return ahead;
    }

    public isVehicleStopped(vehicle: Vehicle): boolean {
        return vehicle.state === 'stopped';
    }

    public isVehicleSlower(vehicle: Vehicle): boolean {
        return vehicle.speed < this._vehicle.speed;
    }

    public mustStopForTfc(tfc: TrafficFlowControl): boolean {
        return tfc.shouldStop(this._vehicle);
    }

    public isNearlyStopped(): boolean {
        return this._vehicle.speed < 0.1;
    }

    public isAboveSpeedLimit(): boolean {
        return this._vehicle.speed > (this._vehicle.segment?.speedLimit ?? Infinity);
    }

    public isAboveMaxSpeed(): boolean {
        return this._vehicle.speed > this._vehicle.maxSpeed;
    }

    public getAngleDiff(segment: RoadSegment): number {
        return Utils.angleFormedBy(this._vehicle.segment.line, segment.line);
    }
}