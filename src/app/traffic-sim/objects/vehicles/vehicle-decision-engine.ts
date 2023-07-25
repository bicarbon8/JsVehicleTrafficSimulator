import { Utils } from "../../helpers/utils";
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
                return 'decelerating';
            }
        }

        const tfcs = this.tfcsAhead();
        if (tfcs.length > 0) {
            if (tfcs.some(tfc => tfc.shouldStop(this._vehicle))) {
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

        if (this.isAboveSpeedLimit() || this.isAboveMaxSpeed()) {
            return 'decelerating';
        }

        return 'accelerating';
    }

    public getCrashedDesiredState(): VehicleState {
        if (this.isNearlyStopped()) {
            return 'stopped';
        }
        return 'decelerating';
    }

    public vehiclesAhead(): Array<Vehicle> {
        const ahead = this._vehicle.simMgr.mapManager.getVehiclesWithinRadius(this._vehicle, this._vehicle.getLookAheadDistance())
            .filter(v => Utils.isCollidingWith(this._vehicle.driverView, v.driverView));

        return ahead;
    }

    public tfcsAhead(): Array<TrafficFlowControl> {
        const ahead = this._vehicle.simMgr.mapManager.getTfcsWithinRadiusAhead(this._vehicle.location, this._vehicle.segment, this._vehicle.getLookAheadDistance());

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
}