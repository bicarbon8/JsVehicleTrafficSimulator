import { Vector3 } from 'three';
import { Utils } from '../helpers/utils';
import { StopLight } from '../objects/traffic-controls/stop-light';
import { StopLightOptions } from '../objects/traffic-controls/stop-light-options';
import { TfcOptions } from '../objects/traffic-controls/tfc-options';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { VehicleGeneratorOptions } from '../objects/vehicles/vehicle-generator-options';
import { RoadMap } from './road-map';
import { RoadSegment } from './road-segment';
import { RoadSegmentOptions } from './road-segment-options';

export class MapManager {
    private _segments: Map<number, RoadSegment>;
    private _up: Vector3;

    constructor() {
        this._segments = new Map<number, RoadSegment>();
        this._up = new Vector3(0, 1, 0);
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

    getVehicleById(vehicleId): Vehicle {
        return this.getVehicles().find((v) => v.id == vehicleId);
    }

    getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
        return this.getVehicles().filter((v) => {
            return v.id != vehicle.id && (Utils.getDistanceBetweenTwoPoints(vehicle.getLocation(), v.getLocation()) <= distance);
        });
    }

    getVehiclesWithinRadiusOnSegment(vehicle: Vehicle, distance: number, segmentId: number): Vehicle[] {
        return this.getSegmentById(segmentId).getVehicles().filter((m) => {
            return (Utils.getDistanceBetweenTwoPoints(vehicle.getLocation(), m.getLocation()) <= distance);
        });
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

    getTfcsWithinRadiusOnSegment(vehicle: Vehicle, distance: number, segmentId: number): TrafficFlowControl[] {
        return this.getSegmentById(segmentId).getTfcs().filter((m) => {
            return (Utils.getDistanceBetweenTwoPoints(vehicle.getLocation(), m.getLocation()) <= distance);
        });
    }

    addSegment(segment: RoadSegment): void {
        // console.debug(`adding segment '${segment.id}' from '${JSON.stringify(segment.getStart())}' to '${JSON.stringify(segment.getEnd())}'`);
        this._segments.set(segment.id, segment);
    }

    removeSegment(segmentId: number): void {
        // remove all vehicles from segment
        let seg: RoadSegment = this._segments.get(segmentId);
        seg.getVehicles().forEach((veh) => {
            seg.removeVehicle(veh.id);
        });
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
        return this.getSegments().filter((seg) => seg.name == roadName);
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
		return this.getSegmentsInRoad(currentSegment.name).filter((seg) => {
            // if less than 5 degrees variance in lines they're similar so return true
            return (Math.abs(Utils.angleFormedBy(seg.getLine(), currentSegment.getLine())) < 5);
        });
	}

    update(elapsedMs: number): void {
        this.getSegments().forEach((seg) => seg.update(elapsedMs));
    }
}

export module MapManager {
    export var inst = new MapManager();
}