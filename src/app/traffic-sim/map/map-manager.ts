import { Box3, BoxGeometry, Line3, Mesh, Quaternion, Vector3 } from 'three';
import { Utils } from '../helpers/utils';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { ShouldStopResponse } from '../objects/vehicles/should-stop-response';
import { ShouldStopType } from '../objects/vehicles/should-stop-type';
import { Vehicle } from '../objects/vehicles/vehicle';
import { RoadSegment } from './road-segment';

export class MapManager {
    private _segments: Map<number, RoadSegment>;
    private _up: Vector3;

    constructor() {
        this._segments = new Map<number, RoadSegment>();
        this._up = new Vector3(0, 1, 0);
    }

    update(elapsedMs: number): void {
        this.getSegments().forEach((seg) => seg.update(elapsedMs));
    }

    getUp(): Vector3 {
        return this._up.clone();
    }

    reset(): void {
        this._segments = new Map<number, RoadSegment>();
    }

    getVehicles(): Vehicle[] {
        let allVehicles: Vehicle[] = [];
        let segments: RoadSegment[] = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            let segment: RoadSegment = segments[i];
            let vehicles: Vehicle[] = segment.getVehicles();
            allVehicles.splice(0, 0, ...vehicles);
        }
        return allVehicles;
    }

    getVehicleById(vehicleId: number): Vehicle {
        let segments: RoadSegment[] = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            let seg: RoadSegment = segments[i];
            let v: Vehicle = seg.getVehicleById(vehicleId);
            if (v) { return v; }
        }
        return null;
    }

    getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
        return this.getVehicles().filter((v) => {
            return v.id != vehicle.id && (Utils.getLength(vehicle.getLocation(), v.getLocation()) <= distance);
        });
    }

    getVehiclesWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): Vehicle[] {
        let distanceToEnd: number = Utils.getLength(location, segment.getEnd());
        let vehicles: Vehicle[] = segment.getVehicles().filter((v) => {
            let distToVeh: number = Utils.getLength(location, v.getLocation());
            if (distToVeh <= distance) {
                return (Utils.getLength(v.getLocation(), segment.getEnd()) <= distanceToEnd);
            }
            return false;
        });
        if (distanceToEnd < distance) {
            let segments: RoadSegment[] = this.getSegmentsStartingAt(segment.getEnd());
            segments.forEach((seg) => {
                vehicles.splice(0, 0, ...this.getVehiclesWithinRadiusAhead(segment.getEnd(), seg, distance - distanceToEnd));
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

    getTfcs(): TrafficFlowControl[] {
        let allTfcs: TrafficFlowControl[] = [];
        let segments: RoadSegment[] = this.getSegments();
        for (var i=0; i<segments.length; i++) {
            let segment: RoadSegment = segments[i];
            let tfcs: TrafficFlowControl[] = segment.getTfcs();
            allTfcs.splice(0, 0, ...tfcs);
        }
        return allTfcs;
    }

    getTfcsWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): TrafficFlowControl[] {
        let distanceToEnd: number = Utils.getLength(location, segment.getEnd());
        let tfcs: TrafficFlowControl[] = segment.getTfcs().filter((tfc) => {
            let distToTfc: number = Utils.getLength(location, tfc.getLocation());
            if (distToTfc <= distance) {
                return (Utils.getLength(tfc.getLocation(), segment.getLine().end) <= distanceToEnd);
            }
            return false;
        });
        if (distanceToEnd < distance) {
            let segments: RoadSegment[] = this.getSegmentsStartingAt(segment.getEnd());
            segments.forEach((seg) => {
                tfcs.splice(0, 0, ...this.getTfcsWithinRadiusAhead(segment.getEnd(), seg, distance - distanceToEnd));
            });
        }

        return tfcs;
    }

    addSegment(segment: RoadSegment): void {
        // console.debug(`adding segment '${segment.id}' from '${JSON.stringify(segment.getStart())}' to '${JSON.stringify(segment.getEnd())}'`);
        this._segments.set(segment.id, segment);
    }

    removeSegment(segmentId: number): void {
        // remove segment from map
        this._segments.delete(segmentId);
    }

	getSegments(): RoadSegment[] {
		return Array.from(this._segments.values());
	}

    getSegmentById(segmentId: number): RoadSegment {
        return this._segments.get(segmentId);
    }

	getSegmentsStartingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.getSegments().filter((seg) => {
                let start: Vector3 = seg.getStart();
                return start.x == location.x &&
                    start.y == location.y &&
                    start.z == location.z;
            });
        }
    }

    getSegmentsEndingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.getSegments().filter((seg) => {
                let end: Vector3 = seg.getEnd();
                return end.x == location.x &&
                    end.y == location.y &&
                    end.z == location.z;
            });
        }
    }

    getSegmentsInRoad(roadName: string): RoadSegment[] {
        return this.getSegments().filter((seg) => seg.roadName == roadName);
    }

    getSegmentsContainingPoint(point: Vector3): RoadSegment[] {
        var segments = [];
        var allSegments: RoadSegment[] = this.getSegments();
        for (var i=0; i<allSegments.length; i++) {
            var segment = allSegments[i];
            if (segment.getStart().x === point.x && segment.getStart().y === point.y && segment.getStart().z === point.z ||
                segment.getEnd().x === point.x && segment.getEnd().y === point.y && segment.getEnd().z === point.z) {
                segments.push(segment);
            } else {
                let points: Vector3[] = segment.getLaneChangePoints();
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
            return currentSegment.id != seg.id && (Math.abs(Utils.angleFormedBy(seg.getLine(), currentSegment.getLine())) < 5);
        });
	}

    shouldStopForVehicles(vehicle: Vehicle): ShouldStopResponse {
        var intersecting: Vehicle[] = this.getIntersectingVehicles(vehicle);
        for (var i=0; i<intersecting.length; i++) {
            let v: Vehicle = intersecting[i];
            if (vehicle.hasInView(v)) {
                return {stop:true, type: ShouldStopType.vehicle, segmentId: v.getSegmentId(), id: v.id};
            }
        }
    
        return {stop: false};
    }

    shouldStopForTfcs(vehicle: Vehicle): ShouldStopResponse {
        var tfcs = this.getTfcsWithinRadiusAhead(vehicle.getLocation(), vehicle.getSegment(), vehicle.getLookAheadDistance());
        for (var i=0; i<tfcs.length; i++) {
            var tfc = tfcs[i];
            if (tfc.shouldStop(vehicle)) {
                return {stop: true, type: ShouldStopType.tfc, segmentId: tfc.getSegmentId(), id: tfc.id};
            }
        }
    
        return {stop: false};
    }

    shouldSlowForCorner(vehicle: Vehicle): ShouldStopResponse {
        // slow down when the next segment is in range and has a different heading
        let distance: number = vehicle.getLookAheadDistance();
        let segEnd: Vector3 = vehicle.getSegment().getEnd();
        var distanceToSegEnd = Utils.getLength(vehicle.getLocation(), segEnd);
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1: Line3 = vehicle.getSegment().getLine();
            var nextSegments: RoadSegment[] = this.getSegmentsStartingAt(segEnd);
            // TODO: only calculate for next segment on choosen path
            for (var i in nextSegments) {
                var nextSegment: RoadSegment = nextSegments[i];
                var line2: Line3 = nextSegment.getLine();
                var angle: number = Math.abs(Utils.angleFormedBy(line1, line2));
                if (angle > headingDiff) {
                    headingDiff = angle;
                }
            }

            var corneringSpeed: number = Utils.corneringSpeedCalculator(headingDiff);
            // begin slowing down
            if (vehicle.getVelocity() > corneringSpeed) {
                return { stop: true, type: ShouldStopType.cornering, headingDifference: headingDiff };
            }
        }

        return {stop: false};
    }

    createChangeLaneSegment(location: Vector3, newSegment: RoadSegment): RoadSegment {
        let changeLaneSegment: RoadSegment;
        let closestPoint: Vector3;
        let points: Vector3[] = newSegment.getLaneChangePoints();
        for (var j=0; j<points.length; j++) {
            var point: Vector3 = points[j];
            var line1: Line3 = new Line3(location, point);
            var line2: Line3 = newSegment.getLine();
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