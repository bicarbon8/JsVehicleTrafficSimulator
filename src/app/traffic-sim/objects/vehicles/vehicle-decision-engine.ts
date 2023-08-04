import { Line3, Vector3 } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { TrafficFlowControl } from "../traffic-controls/traffic-flow-control";
import { Vehicle, VehicleState } from "./vehicle";

export class VehicleDecisionEngine {
    public getDesiredState(vehicle: Vehicle): VehicleState {
        if (vehicle.isCrashed()) {
            return this._getCrashedDesiredState(vehicle);
        }
        switch (vehicle.state) {
            case 'stopped':
                return this._getStoppedDesiredState(vehicle);
            case 'accelerating':
                return this._getAcceleratingDesiredState(vehicle);
            case 'decelerating':
                return this._getDeceleratingDesiredState(vehicle);
            case 'changinglane':
                return this._getAcceleratingDesiredState(vehicle);
            default:
                return vehicle.state;
        }
    }

    private _getStoppedDesiredState(vehicle: Vehicle): VehicleState {
        const vehicles = this._vehiclesAhead(vehicle);
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped')) {
                return 'stopped';
            }
        }

        const tfcs = this._tfcsAhead(vehicle);
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(vehicle))) {
                return 'stopped';
            }
        }

        return 'accelerating';
    }

    private _getAcceleratingDesiredState(vehicle: Vehicle): VehicleState {
        const vehicles = this._vehiclesAhead(vehicle);
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped' || this._isVehicle2Slower(vehicle, v))) {
                if (vehicle.canChangeLanes()) {
                    if (this._shouldChangeLanes(vehicle)) {
                        return 'changinglane';
                    }
                }
                return 'decelerating';
            }
        }

        const tfcs = this._tfcsAhead(vehicle);
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(vehicle))) {
                return 'decelerating';
            }
        }

        const segments = this._segmentsAhead(vehicle);
        if (segments.length > 0) {
            if (segments.some(s => vehicle.speed > Utils.corneringSpeedCalculator(Utils.angleFormedBy(vehicle.segment.line, s.line)))) {
                return 'decelerating';
            }
        }

        if (this._isAboveSpeedLimit(vehicle) || this._isAboveMaxSpeed(vehicle)) {
            return 'decelerating';
        }

        return 'accelerating';
    }

    private _getDeceleratingDesiredState(vehicle: Vehicle): VehicleState {
        const vehicles = this._vehiclesAhead(vehicle);
        if (vehicles.length > 0) {
            if (vehicles.some(v => v.state === 'stopped' || this._isVehicle2Slower(vehicle, v))) {
                if (vehicle.canChangeLanes()) {
                    if (this._shouldChangeLanes(vehicle)) {
                        return 'changinglane';
                    }
                }
                if (this._isNearlyStopped(vehicle)) {
                    return 'stopped';
                }
                return 'decelerating';
            }
        }

        const tfcs = this._tfcsAhead(vehicle);
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(vehicle))) {
                if (this._isNearlyStopped(vehicle)) {
                    return 'stopped';
                }
                return 'decelerating';
            }
        }

        const segments = this._segmentsAhead(vehicle);
        if (segments.length > 0) {
            if (segments.some(s => vehicle.speed > Utils.corneringSpeedCalculator(Utils.angleFormedBy(vehicle.segment.line, s.line)))) {
                return 'decelerating';
            }
        }

        if (this._isAboveSpeedLimit(vehicle) || this._isAboveMaxSpeed(vehicle)) {
            return 'decelerating';
        }

        return 'accelerating';
    }

    private _shouldChangeLanes(vehicle: Vehicle): boolean {
        const loc = vehicle.location;
        const aPoint = new Vector3();
        const bPoint = new Vector3();
        const line = new Line3();
        const similar = vehicle.simMgr.mapManager.getParallelSegmentsInRoad(vehicle.segment)
            .sort((a, b) => {
                a.line.closestPointToPoint(loc, true, aPoint);
                b.line.closestPointToPoint(loc, true, bPoint);
                const aDist = line.set(loc, aPoint).distance();
                const bDist = line.set(loc, bPoint).distance();
                if (aDist < bDist) {
                    return -1;
                } else if (aDist > bDist) {
                    return 1;
                } else {
                    return 0;
                }
            });
        const closestSimilar = (similar.length > 0) ? similar[0] : null;
        if (closestSimilar) {
            // if vehicles ahead on closest segment
            const vehs = this._vechiclesAheadOn(vehicle, closestSimilar);
            // and if those vehicles are stopped or slower
            if (vehs.some(v => v.state === 'stopped' || this._isVehicle2Slower(vehicle, v))) {
                // don't change lanes
                return false;
            }
            // otherwise change lanes
            return true;
        }
        return false;
    }

    private _getCrashedDesiredState(vehicle: Vehicle): VehicleState {
        if (this._isNearlyStopped(vehicle)) {
            return 'stopped';
        }
        return 'decelerating';
    }

    private _vehiclesAhead(vehicle: Vehicle): Array<Vehicle> {
        const ahead = vehicle.simMgr.mapManager.getVehiclesWithinRadius(vehicle, vehicle.getLookAheadDistance())
            .filter(v => {
                return vehicle.hasInViewAhead(v)
                    && Math.abs(Utils.angleFormedBy(Utils.getHeadingLine(vehicle), Utils.getHeadingLine(v))) < 50
            });

        return ahead;
    }

    private _vechiclesAheadOn(vehicle: Vehicle, segment: RoadSegment): Array<Vehicle> {
        const ahead = vehicle.simMgr.mapManager.getVehiclesWithinRadius(vehicle, vehicle.getLookAheadDistance())
            .filter(v => v.segmentId === segment.id);

        return ahead;
    }

    private _tfcsAhead(vehicle: Vehicle): Array<TrafficFlowControl> {
        const ahead = vehicle.simMgr.mapManager.getTfcsWithinRadiusAhead(
            vehicle.location,
            vehicle.segment,
            vehicle.getLookAheadDistance()
        );

        return ahead;
    }

    private _segmentsAhead(vehicle: Vehicle): Array<RoadSegment> {
        const ahead = new Array<RoadSegment>();
        let remainingDist = vehicle.getLookAheadDistance();
        let pos = vehicle.location;
        let segment = vehicle.segment;
        while (segment && remainingDist > 0) {
            ahead.push(segment);
            const dist = Utils.getLength(pos, segment.end);
            remainingDist -= dist;
            if (remainingDist > 0) {
                const nextSegments = vehicle.simMgr.mapManager.getSegmentsStartingAt(segment.end, segment.roadName);
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

    private _isVehicle2Slower(vehicle1: Vehicle, vehicle2: Vehicle): boolean {
        return vehicle2.speed < vehicle1.speed;
    }

    private _isNearlyStopped(vehicle: Vehicle): boolean {
        return vehicle.speed < 0.1;
    }

    private _isAboveSpeedLimit(vehicle: Vehicle): boolean {
        return vehicle.speed > (vehicle.segment?.speedLimit ?? Infinity);
    }

    private _isAboveMaxSpeed(vehicle: Vehicle): boolean {
        return vehicle.speed > vehicle.maxSpeed;
    }
}