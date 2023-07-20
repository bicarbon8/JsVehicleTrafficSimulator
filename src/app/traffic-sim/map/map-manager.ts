import { Box3, Line3, Vector3 } from 'three';
import { Utils } from '../helpers/utils';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { Vehicle } from '../objects/vehicles/vehicle';
import { RoadSegment } from './road-segment';

export class MapManager {
    private _roadSegments: Map<number, RoadSegment>;
    private _up: Vector3;

    constructor() {
        this._roadSegments = new Map<number, RoadSegment>();
        this._up = new Vector3(0, 1, 0);
    }

    update(elapsedMs: number): void {
        this.segments.forEach((seg) => seg.update(elapsedMs));
    }

    /**
     * indicates the direction used to indicate "up"
     */
    get up(): Vector3 {
        return this._up.clone();
    }

    reset(): void {
        this.segments.forEach((seg) => {
            this.removeSegment(seg.id);
        });
        this._roadSegments = new Map<number, RoadSegment>();
    }

    destroy(): void {
        this.reset();
        this._roadSegments = null;
    }

    get vehicles(): Vehicle[] {
        let allVehicles: Vehicle[] = [];
        let segments: RoadSegment[] = this.segments;
        for (var i=0; i<segments.length; i++) {
            let segment: RoadSegment = segments[i];
            let vehicles: Vehicle[] = segment.vehicles;
            allVehicles.splice(0, 0, ...vehicles);
        }
        return allVehicles;
    }

    /**
     * an expensive lookup that iterates over all `RoadSegement` objects getting all
     * `Vehicle` objects and then filtering these down to the one who's `id` matches
     * the supplied `vehicleId` (if any).
     * 
     * NOTE: it is better to call `vehicle.segment.getVehicleById(vehicleId)` or
     * `vehicle.simMgr.mapManager.getSegmentById(segmentId).getVehicleById(vehicleId)` if you
     * know the `RoadSegment` the `Vehicle` is on
     * @param vehicleId the `id` of the `Vehicle` to return
     * @returns a `Vehicle` who's `id` matches the supplied `vehicleId` or `null` if none found
     */
    getVehicleById(vehicleId: number): Vehicle {
        return this.vehicles.find(v => v.id === vehicleId);
    }

    getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
        const withinRadius = this.vehicles.filter((v) => {
            return v.id != vehicle.id && (Utils.getLength(vehicle.getLocation(), v.getLocation()) <= distance);
        });
        return withinRadius;
    }

    getVehiclesWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): Vehicle[] {
        let distanceToEnd: number = Utils.getLength(location, segment.end);
        let vehicles: Vehicle[] = segment.vehicles.filter((v) => {
            let distToVeh: number = Utils.getLength(location, v.getLocation());
            if (distToVeh <= distance) {
                return (Utils.getLength(v.getLocation(), segment.end) <= distanceToEnd);
            }
            return false;
        });
        if (distanceToEnd < distance) {
            let segments: RoadSegment[] = this.getSegmentsStartingAt(segment.end);
            segments.forEach((seg) => {
                vehicles.splice(0, 0, ...this.getVehiclesWithinRadiusAhead(segment.end, seg, distance - distanceToEnd));
            });
        }

        return vehicles;
    }

    getIntersectingVehicles(vehicle: Vehicle): Vehicle[] {
        let intersects: Vehicle[] = [];
        let dist: number = vehicle.getLookAheadDistance();
        let vehicles: Vehicle[] = this.getVehiclesWithinRadius(vehicle, dist);
        let vehicleBox: Box3 = vehicle.getLookAheadCollisionBox();
        
        for (var i=0; i<vehicles.length; i++) {
            let v: Vehicle = vehicles[i];
            let vBox: Box3 = v.getLookAheadCollisionBox();
            if (vehicleBox.intersectsBox(vBox)) {
                intersects.push(v);
            }
        }

        return intersects;
    }

    get trafficFlowControls(): TrafficFlowControl[] {
        let allTfcs: TrafficFlowControl[] = [];
        let segments: RoadSegment[] = this.segments;
        for (var i=0; i<segments.length; i++) {
            let segment: RoadSegment = segments[i];
            let tfcs: TrafficFlowControl[] = segment.trafficFlowControls;
            allTfcs.splice(0, 0, ...tfcs);
        }
        return allTfcs;
    }

    getTfcsWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): TrafficFlowControl[] {
        let distanceToEnd: number = Utils.getLength(location, segment.end);
        let tfcs: TrafficFlowControl[] = segment.trafficFlowControls.filter((tfc) => {
            let distToTfc: number = Utils.getLength(location, tfc.getLocation());
            if (distToTfc <= distance) {
                return (Utils.getLength(tfc.getLocation(), segment.end) <= distanceToEnd);
            }
            return false;
        });
        if (distanceToEnd < distance) {
            let segments: RoadSegment[] = this.getSegmentsStartingAt(segment.end);
            segments.forEach((seg) => {
                tfcs.splice(0, 0, ...this.getTfcsWithinRadiusAhead(segment.end, seg, distance - distanceToEnd));
            });
        }

        return tfcs;
    }

    addSegment(segment: RoadSegment): void {
        // console.debug(`adding segment '${segment.id}' from '${JSON.stringify(segment.start)}' to '${JSON.stringify(segment.end)}'`);
        this._roadSegments.set(segment.id, segment);
    }

    removeSegment(segmentId: number): void {
        // remove segment from map
        this._roadSegments.delete(segmentId);
    }

	get segments(): RoadSegment[] {
		return Array.from(this._roadSegments.values());
	}

    getSegmentById(segmentId: number): RoadSegment {
        return this._roadSegments.get(segmentId);
    }

	getSegmentsStartingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.segments.filter((seg) => {
                let start: Vector3 = seg.start;
                return start.x == location.x &&
                    start.y == location.y &&
                    start.z == location.z;
            });
        }
    }

    getSegmentsEndingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.segments.filter((seg) => {
                let end: Vector3 = seg.end;
                return end.x == location.x &&
                    end.y == location.y &&
                    end.z == location.z;
            });
        }
    }

    getSegmentsInRoad(roadName: string): RoadSegment[] {
        return this.segments.filter((seg) => seg.roadName == roadName);
    }

    getSegmentsContainingPoint(point: Vector3): RoadSegment[] {
        var segments = [];
        var allSegments: RoadSegment[] = this.segments;
        for (var i=0; i<allSegments.length; i++) {
            var segment = allSegments[i];
            if (segment.start.x === point.x && segment.start.y === point.y && segment.start.z === point.z ||
                segment.end.x === point.x && segment.end.y === point.y && segment.end.z === point.z) {
                segments.push(segment);
            } else {
                let points: Vector3[] = segment.laneChangePoints;
                for (var j=0; j<points.length; j++) {
                    var changePoint = points[j];
                    if (changePoint.x === point.x && changePoint.y === point.y && changePoint.z === point.z) {
                        segments.push(segment);
                        break;
                    }
                }
            }
        }
		return segments;
	}

	getSimilarSegmentsInRoad(currentSegment: RoadSegment) {
		return this.getSegmentsInRoad(currentSegment.roadName).filter((seg) => {
            // if less than 5 degrees variance in lines they're similar so return true
            return currentSegment.id != seg.id && (Math.abs(Utils.angleFormedBy(seg.line, currentSegment.line)) < 5);
        });
	}

    shouldStopForVehicles(vehicle: Vehicle): Vehicle {
        var intersecting: Vehicle[] = this.getIntersectingVehicles(vehicle);
        for (var i=0; i<intersecting.length; i++) {
            let v: Vehicle = intersecting[i];
            if (vehicle.hasInView(v)) {
                return v;
            }
        }
    
        return null;
    }

    /**
     * checks the passed in `vehicle` against the current road to determine if any 
     * `TrafficFlowControl` ahead indicates that the vehicle should stop and returns
     * it if so; otherwise `null` is returned
     * @param vehicle the `Vehicle` to be checked against any upcoming `TrafficFlowControl`
     * @returns the `TrafficFlowControl` found that should result in the vehicle stopping or
     * `null` if the vehicle should not slow down
     */
    shouldStopForTfcs(vehicle: Vehicle): TrafficFlowControl {
        var tfcs = this.getTfcsWithinRadiusAhead(vehicle.getLocation(), vehicle.segment, vehicle.getLookAheadDistance());
        for (var i=0; i<tfcs.length; i++) {
            var tfc = tfcs[i];
            if (tfc.shouldStop(vehicle)) {
                return tfc;
            }
        }
    
        return null;
    }

    /**
     * checks the passed in `vehicle` against the current road to determine if
     * the vehicle's speed is too great for the severity of the corner
     * @param vehicle the `Vehicle` to be checked against any upcoming corners
     * @returns a `number` indicating the difference in heading between the passed
     * in `vehicle` and the corner's exit angle or `null` if no slowing down is required
     */
    shouldSlowForCorner(vehicle: Vehicle): number {
        // slow down when the next segment is in range and has a different heading
        let distance: number = vehicle.getLookAheadDistance();
        let segEnd: Vector3 = vehicle.segment.end;
        var distanceToSegEnd = Utils.getLength(vehicle.getLocation(), segEnd);
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1: Line3 = vehicle.segment.line;
            var nextSegments: RoadSegment[] = this.getSegmentsStartingAt(segEnd);
            // TODO: only calculate for next segment on choosen path
            for (var i in nextSegments) {
                var nextSegment: RoadSegment = nextSegments[i];
                var line2: Line3 = nextSegment.line;
                var angle: number = Math.abs(Utils.angleFormedBy(line1, line2));
                if (angle > headingDiff) {
                    headingDiff = angle;
                }
            }

            var corneringSpeed: number = Utils.corneringSpeedCalculator(headingDiff);
            // begin slowing down
            if (vehicle.velocity > corneringSpeed) {
                return headingDiff;
            }
        }

        return null;
    }

    createChangeLaneSegment(location: Vector3, newSegment: RoadSegment): RoadSegment {
        let changeLaneSegment: RoadSegment;
        let closestPoint: Vector3;
        let points: Vector3[] = newSegment.laneChangePoints;
        for (var j=0; j<points.length; j++) {
            var point: Vector3 = points[j];
            var line1: Line3 = new Line3(location, point);
            var line2: Line3 = newSegment.line;
            var angle: number = Math.abs(Utils.angleFormedBy(line1, line2));
            // TODO: base angle on speed where greater angles allowed at lower speeds
            if (angle <= 25 && angle > 5) {
                if (!closestPoint) {
                    closestPoint = point;
                } else {
                    if (line1.distance() < Utils.getLength(closestPoint, location)) {
                        closestPoint = point;
                    }
                }
            }
        }

        if (closestPoint) {
            // create tmp segment to new lane
            changeLaneSegment = new RoadSegment({
                start: location,
                end: closestPoint,
                speedLimit: newSegment.speedLimit,
                isInlet: true
            });
            this.addSegment(changeLaneSegment);
        }

        return changeLaneSegment;
    }
}

export module MapManager {
    export var inst = new MapManager();
}