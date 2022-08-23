import { Box3, Line3, Vector3 } from 'three';
import { Utils } from '../helpers/utils';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { ShouldStopResponse } from '../objects/vehicles/should-stop-response';
import { ShouldStopType } from '../objects/vehicles/should-stop-type';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';
import { RoadSegment } from './road-segment';

/**
 * class responsible for managing where `RoadSegment`, `Vehicle` and `TrafficFlowControl`
 * objects are located and for limiting the lookup radius around these objects for collisions or
 * other interactions detection
 */
export class MapManager {
    readonly simMgr: SimulationManager;

    #segments: Array<RoadSegment>;
    #vehicles: Map<number, Vehicle>;
    #generators: Array<VehicleGenerator>;
    #tfcs: Array<TrafficFlowControl>;

    constructor(simMgr: SimulationManager) {
        this.simMgr = simMgr;
        this.#segments = new Array<RoadSegment>();
        this.#vehicles = new Map<number, Vehicle>();
        this.#generators = new Array<VehicleGenerator>();
        this.#tfcs = new Array<TrafficFlowControl>();
    }

    /**
     * calls the `update` function for all `RoadSegment` objects tracked
     * by this `MapManager`
     * @param elapsedMs the amount of time in milliseconds that has passed
     * since the last call to `update`
     */
    update(elapsedMs: number): void {
        this.vehicles.forEach(veh => veh.update(elapsedMs));
        this.#generators.forEach(gen => gen.update(elapsedMs));
        this.#tfcs.forEach(tfc => tfc.update(elapsedMs));
    }

    /**
     * returns a new Vector3 pointing up
     */
    get upVector(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    reset(): void {
        this.destroy();
        this.#segments = new Array<RoadSegment>();
    }

    /**
     * removes all `RoadSegment` objects from this `MapManager`
     */
    destroy(): void {
        while (this.#generators.length > 0) {
            this.removeGenerator(this.#generators[0]);
        }
        while (this.vehicles.length > 0) {
            this.removeVehicle(this.vehicles[0]);
        }
        while (this.#tfcs.length > 0) {
            this.removeTfc(this.#tfcs[0]);
        }
        while (this.#segments.length > 0) {
            this.removeSegment(this.#segments[0]);
        }
    }

    addVehicle(vehicle: Vehicle, segment?: RoadSegment, location?: Vector3): this {
        if (vehicle) {
            this.#vehicles.set(vehicle.id, vehicle);
        }
        if (segment) {
            let oldSegment: RoadSegment = this.getSegmentById(vehicle.getSegmentId());
            if (oldSegment) { oldSegment.removeVehicle(vehicle); }
            let loc: Vector3;
            if (location) {
                loc = location
            } else {
                loc = segment.getStart();
            }
            vehicle.setSegmentId(segment.id);
            vehicle.setPosition(loc);
            vehicle.lookAt(segment.getEnd());
        }
        return this;
    }

    removeVehicle(vehicle: Vehicle | number): this {
        let v: Vehicle;
        if (typeof vehicle === "number") {
            v = this.#vehicles.get(vehicle);
        } else {
            v = this.#vehicles.get(vehicle.id);
        }
        this.#vehicles.delete(v.id);
        this.simMgr.remove(v);
        return this;
    }

    get vehicles(): Array<Vehicle> {
        return Array.from(this.#vehicles.values());
    }

    getVehicleById(vehicleId: number): Vehicle {
        return this.#vehicles.get(vehicleId);
    }

    getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
        const vLoc: Vector3 = vehicle.getLocation();
        const vId: number = vehicle.id;
        return this.vehicles.filter((v) => {
            return v.id != vId && (Utils.getLength(vLoc, v.getLocation()) <= distance);
        });
    }

    getVehiclesWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): Vehicle[] {
        let distanceToEnd: number = Utils.getLength(location, segment.getEnd());
        let vehicles: Vehicle[] = this.vehicles.filter((v) => {
            if (v.getSegmentId() === segment.id) {
                let distToVeh: number = Utils.getLength(location, v.getLocation());
                if (distToVeh <= distance) {
                    return (Utils.getLength(v.getLocation(), segment.getEnd()) <= distanceToEnd);
                }
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

    /**
     * compares the paths of nearby vehicles with the passed in `vehicle` and returns an array
     * of other vehicles whose paths intesect with this one's
     * @param vehicle used to calculate a path for detection of vehicles who will cross this path
     * @returns a `Array<Vehicle>` of vehicles whose paths intersect with the passed in `vehicle` path
     */
    getIntersectingVehicles(vehicle: Vehicle): Vehicle[] {
        let intersects: Vehicle[] = [];
        let dist: number = vehicle.getStopDistance();
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

    addTfc(tfc: TrafficFlowControl, segment?: RoadSegment, location?: Vector3): this {
        if (tfc) {
            this.#tfcs.push(tfc);
        }
        if (segment) {
            segment.addTfc(tfc);
            let l: Line3 = segment.getLine();
            let loc: Vector3 = location || l.end;
            tfc.setPosition(loc);
            tfc.lookAt(l.start);
            tfc.setSegmentId(segment.id);
        }
        return this;
    }

    removeTfc(tfc: TrafficFlowControl | number): this {
        let index: number;
        if (typeof tfc === "number") {
            index = this.#tfcs.findIndex(t => t.id === tfc);
        } else {
            index = this.#tfcs.findIndex(t => t.id === tfc.id);
        }
        if (index >= 0) {
            const tfcObj = this.#tfcs.splice(index, 1)?.find(t => t != null);
            this.simMgr.remove(tfcObj);
        }
        return this;
    }

    get tfcs(): TrafficFlowControl[] {
        return this.#tfcs;
    }

    getTfcsWithinRadiusAhead(location: Vector3, segment: RoadSegment, distance: number): TrafficFlowControl[] {
        let distanceToEnd: number = Utils.getLength(location, segment.getEnd());
        let tfcs: TrafficFlowControl[] = this.tfcs.filter((tfc) => {
            if (tfc.getSegmentId() === segment.id) {
                let distToTfc: number = Utils.getLength(location, tfc.getLocation());
                if (distToTfc <= distance) {
                    return (Utils.getLength(tfc.getLocation(), segment.getLine().end) <= distanceToEnd);
                }
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

    addGenerator(generator: VehicleGenerator, segment?: RoadSegment, location?: Vector3): this {
        if (generator) {
            this.#generators.push(generator);
        }
        if (segment) {
            const loc = location || segment.getStart();
            generator.setPosition(loc);
            generator.lookAt(segment.getEnd());
            generator.setSegmentId(segment.id);
            segment.addGenerator(generator);
        }
        return this;
    }

    removeGenerator(generator: VehicleGenerator | number): this {
        let index: number;
        if (typeof generator === "number") {
            index = this.#generators.findIndex(g => g.id === generator);
        } else {
            index = this.#generators.findIndex(g => g.id === generator.id);
        }
        if (index >= 0) {
            this.#generators.splice(index, 1);
        }
        return this;
    }

    addSegment(segment: RoadSegment): this {
        this.#segments.push(segment);
        return this;
    }

    removeSegment(segment: RoadSegment | number): this {
        let index: number;
        if (typeof segment === "number") {
            index = this.#segments.findIndex(s => s.id === segment);
        } else {
            index = this.#segments.findIndex(s => s.id === segment.id);
        }
        if (index >= 0) {
            let seg = this.#segments.splice(index, 1)?.find(s => s != null);
            this.simMgr.remove(seg);
        }
        return this;
    }

	get segments(): RoadSegment[] {
		return this.#segments;
	}

    getSegmentById(segmentId: number): RoadSegment {
        const index: number = this.#segments.findIndex(s => s.id === segmentId);
        if (index >= 0) {
            return this.#segments[index];
        }
        return null;
    }

	getSegmentsStartingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.#segments.filter((seg) => {
                let start: Vector3 = seg.getStart();
                return Utils.isWithinDistance(start, location, 0.1);
            });
        }
    }

    getSegmentsEndingAt(location: Vector3): RoadSegment[] {
        if (location) {
            return this.#segments.filter((seg) => {
                let end: Vector3 = seg.getEnd();
                return Utils.isWithinDistance(end, location, 0.1);
            });
        }
    }

    getSegmentsInRoad(roadName: string): RoadSegment[] {
        return this.#segments.filter((seg) => seg.roadName == roadName);
    }

    getSegmentsContainingPoint(point: Vector3): RoadSegment[] {
        var segments = [];
        for (var i=0; i<this.#segments.length; i++) {
            var segment = this.#segments[i];
            let points: Vector3[] = [
                ...segment.getLaneChangePoints(),
                segment.getStart(),
                segment.getEnd()
            ];
            for (var j=0; j<points.length; j++) {
                var segmentPoint = points[j];
                if (Utils.isWithinDistance(segmentPoint, point, 0.1)) {
                    segments.push(segment);
                    break;
                }
            }
        }
		return segments;
	}

	getSimilarSegmentsInRoad(currentSegmentId: number) {
        const currentSegment: RoadSegment = this.getSegmentById(currentSegmentId);
		return this.getSegmentsInRoad(currentSegment.roadName)
        .filter((seg) => {
            let segPoints = seg.getLaneChangePoints();
            let currPoints = currentSegment.getLaneChangePoints();
            let closePoints: number = 0;
            for (var i=0; i<currPoints.length; i++) {
                let currPoint = currPoints[i];
                for (var j=0; j<segPoints.length; j++) {
                    let segPoint = segPoints[j];
                    if (Utils.isWithinDistance(currPoint, segPoint, 10)) {
                        closePoints++;
                    }
                }
            }
            return closePoints > 1;
        })
        .filter((seg) => {
            // if less than 1 degrees variance in lines they're similar so return true
            return currentSegment.id != seg.id && (Math.abs(Utils.angleFormedBy(seg.getLine(), currentSegment.getLine())) < 5);
        });
	}

    shouldStopForVehicles(vehicle: Vehicle): ShouldStopResponse {
        const ahead: Array<Vehicle> = this.getVehiclesWithinRadiusAhead(
            vehicle.getLocation(), 
            this.getSegmentById(vehicle.getSegmentId()), 
            vehicle.getStopDistance()
        );
        for (var i=0; i<ahead.length; i++) {
            let v = ahead[i];
            if (v.getVelocity() < vehicle.getVelocity()) {
                return {stop:true, type: ShouldStopType.vehicle, segmentId: v.getSegmentId(), id: v.id};
            }
        }
        
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
        const vehicleSegment: RoadSegment = this.getSegmentById(vehicle.getSegmentId());
        var tfcs = this.getTfcsWithinRadiusAhead(vehicle.getLocation(), vehicleSegment, vehicle.getStopDistance());
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
        const vehicleSegment: RoadSegment = this.getSegmentById(vehicle.getSegmentId());
        let distance: number = vehicle.getStopDistance();
        let segEnd: Vector3 = vehicleSegment.getEnd();
        var distanceToSegEnd = Utils.getLength(vehicle.getLocation(), segEnd);
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1: Line3 = vehicleSegment.getLine();
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

    createChangeLaneSegment(vehicle: Vehicle, newSegment: RoadSegment): RoadSegment {
        const location = vehicle.getLocation();
        const currentSegment = this.getSegmentById(vehicle.getSegmentId());
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
                id: +`${currentSegment.id}.${newSegment.id}`,
                name: `{"old": "${currentSegment.id}", "new": "${newSegment.id}"}`,
                map: this,
                start: location,
                end: closestPoint,
                speedLimit: newSegment.speedLimit,
                isInlet: true
            });
            this.addSegment(changeLaneSegment);
        }

        return changeLaneSegment;
    }

    getTotalDistance(...segments: Array<RoadSegment | number>): number {
        let totalDistance: number = 0;
        if (segments?.length) {
            for (var i=0; i<segments.length; i++) {
                const segmentOrSegmentId = segments[i];
                let seg: RoadSegment;
                if (typeof segmentOrSegmentId === "number") {
                    seg = this.getSegmentById(segmentOrSegmentId);
                } else {
                    seg = segmentOrSegmentId;
                }
                totalDistance += seg.getLength();
            }
        }
        return totalDistance;
    }

    getNextSegment(currentSegmentOrId: RoadSegment | number): RoadSegment {
        let seg: RoadSegment;
        if (typeof currentSegmentOrId === "number") {
            seg = this.getSegmentById(currentSegmentOrId);
        } else {
            seg = currentSegmentOrId;
        }
        const nextSegments: Array<RoadSegment> = this.getSegmentsStartingAt(seg.getEnd());
        return nextSegments[Utils.getRandomInt(0, nextSegments.length)];
    }
}