// import { Utils } from '../helpers/utils';
// import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
// import { ShouldStopResponse } from '../objects/vehicles/should-stop-response';
// import { ShouldStopType } from '../objects/vehicles/should-stop-type';
// import { Vehicle, VehicleOptions } from '../objects/vehicles/vehicle';
// import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
// import { LaneSegment, LaneSegmentOptions } from './lane-segment';

// /**
//  * class responsible for managing where `RoadSegment`, `Vehicle` and `TrafficFlowControl`
//  * objects are located and for limiting the lookup radius around these objects for collisions or
//  * other interactions detection
//  */
// export class MapManager {
//     readonly scene: Phaser.Scene;

//     #segments: Array<LaneSegment>;
//     #vehicles: Map<number, Vehicle>;
//     #generators: Array<VehicleGenerator>;
//     #tfcs: Array<TrafficFlowControl<any>>;

//     constructor(scene: Phaser.Scene) {
//         this.scene = scene;
//         this.#segments = new Array<LaneSegment>();
//         this.#vehicles = new Map<number, Vehicle>();
//         this.#generators = new Array<VehicleGenerator>();
//         this.#tfcs = new Array<TrafficFlowControl<any>>();
//     }

//     /**
//      * calls the `update` function for all `RoadSegment` objects tracked
//      * by this `MapManager`
//      * @param time the total elapsed time since starting
//      * @param delta the amount of time in milliseconds that has passed
//      * since the last call to `update`
//      */
//     update(time: number, delta: number): void {
//         this.vehicles.forEach(veh => veh.update(time, delta));
//         this.#generators.forEach(gen => gen.update(delta));
//         this.#tfcs.forEach(tfc => tfc.update(time, delta));
//     }

//     reset(): void {
//         this.destroy();
//         this.#segments = new Array<LaneSegment>();
//     }

//     /**
//      * removes all `RoadSegment` objects from this `MapManager`
//      */
//     destroy(): void {
//         while (this.#generators.length > 0) {
//             this.removeGenerator(this.#generators[0]);
//         }
//         while (this.vehicles.length > 0) {
//             this.removeVehicle(this.vehicles[0]);
//         }
//         while (this.#tfcs.length > 0) {
//             this.removeTfc(this.#tfcs[0]);
//         }
//         while (this.#segments.length > 0) {
//             this.removeSegment(this.#segments[0]);
//         }
//     }

//     addVehicle(vehicleOptions: VehicleOptions, segment?: LaneSegment, location?: Phaser.Math.Vector2): this {
//         if (vehicleOptions) {
//             this.#vehicles.set(vehicle.id, vehicle);
//         }
//         if (segment) {
//             let oldSegment: LaneSegment = this.getSegmentById(vehicle.segmentId);
//             if (oldSegment) { oldSegment.removeVehicle(vehicle); }
//             let loc: Phaser.Math.Vector2;
//             if (location) {
//                 loc = location
//             } else {
//                 loc = segment.start;
//             }
//             vehicle.segmentId = segment.id;
//             vehicle.location = loc;
//             vehicle.lookAt(segment.end);
//         }
//         return this;
//     }

//     removeVehicle(vehicle: Vehicle | number): this {
//         let v: Vehicle;
//         if (typeof vehicle === "number") {
//             v = this.#vehicles.get(vehicle);
//         } else {
//             v = this.#vehicles.get(vehicle.id);
//         }
//         this.#vehicles.delete(v.id);
//         this.scene.children.remove(v.gameObj);
//         return this;
//     }

//     get vehicles(): Array<Vehicle> {
//         return Array.from(this.#vehicles.values());
//     }

//     getVehicleById(vehicleId: number): Vehicle {
//         return this.#vehicles.get(vehicleId);
//     }

//     getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
//         const vLoc: Phaser.Math.Vector2 = vehicle.location;
//         const vId: number = vehicle.id;
//         return this.vehicles.filter((v) => {
//             return v.id != vId && (Utils.getLength(vLoc, v.location) <= distance);
//         });
//     }

//     /**
//      * gets all `Vehicle` objects within the specified `distance` from the passed in `location` where
//      * those vehicles are ahead of the specified `location` (as determined by proximity to the end of
//      * the `RoadSegment`)
//      * @param location the current location used for distances
//      * @param segment the current `RoadSegment` to get vehicles from
//      * @param distance the maximum distance ahead to look
//      * @returns an array of `Vehicle` objects where all will be within the specified `distance` and ahead of
//      * the specified `location` (as determined by proximity to the end of the `RoadSegment`)
//      */
//     getVehiclesWithinRadiusAhead(location: Phaser.Math.Vector2, segment: LaneSegment, distance: number): Array<Vehicle> {
//         let vehicles: Array<Vehicle>;
//         if (distance > 0) {
//             const distanceToEnd: number = Utils.getLength(location, segment.end);
//             vehicles = this.vehicles
//                 .filter(v => v.laneSegmentId === segment.id) // only vehicles on `segment`...
//                 .filter((v) => { // ...only vehicles within `distance` to `location`...
//                     let distToVeh: number = Utils.getLength(location, v.location);
//                     return distToVeh <= distance;
//                 })
//                 .filter((v) => { // ...only vehicles closer to end of `segment` than `location`
//                     let vDistToEnd = Utils.getLength(v.location, segment.end);
//                     return vDistToEnd <= distanceToEnd;
//                 });
//             // if our `distance` is greater than to the end of the `segment` recurse into next available segment(s)
//             if (distanceToEnd < distance) {
//                 const remaining = distance - distanceToEnd;
//                 const segments: LaneSegment[] = this.getSegmentsStartingAt(segment.end);
//                 if (segments?.length) {
//                     segments.forEach(seg => vehicles.splice(0, 0, ...this.getVehiclesWithinRadiusAhead(seg.start, seg, remaining)));
//                 }
//             }
//         }

//         return vehicles;
//     }

//     /**
//      * compares the paths of nearby vehicles with the passed in `vehicle` and returns an array
//      * of other vehicles whose paths intesect with this one's
//      * @param vehicle used to calculate a path for detection of vehicles who will cross this path
//      * @returns a `Array<Vehicle>` of vehicles whose paths intersect with the passed in `vehicle` path
//      */
//     getIntersectingVehicles(vehicle: Vehicle): Vehicle[] {
//         let intersects: Vehicle[] = [];
//         let dist: number = Utils.getStopDistance(vehicle.getSpeed(), vehicle.reactionTime, vehicle.deceleration);
//         let vehicles: Vehicle[] = this.getVehiclesWithinRadius(vehicle, dist);
//         let vehicleBox = vehicle.getLookAheadCollisionBox();
        
//         for (var i=0; i<vehicles.length; i++) {
//             let v: Vehicle = vehicles[i];
//             let vBox = v.getLookAheadCollisionBox();
//             if (Utils.isCollidingWith(vehicleBox, vBox)) {
//                 intersects.push(v);
//             }
//         }

//         return intersects;
//     }

//     addTfc(tfc: TrafficFlowControl<any>, segment?: LaneSegment, location?: Phaser.Math.Vector2): this {
//         if (tfc) {
//             this.#tfcs.push(tfc);
//         }
//         if (segment) {
//             segment.addTfc(tfc);
//             let loc: Phaser.Math.Vector2 = location || segment.end;
//             tfc.location = loc;
//             tfc.lookAt(segment.start);
//             tfc.laneSegmentId = segment.id;
//         }
//         return this;
//     }

//     removeTfc(tfc: TrafficFlowControl<any> | number): this {
//         let index: number;
//         if (typeof tfc === "number") {
//             index = this.#tfcs.findIndex(t => t.id === tfc);
//         } else {
//             index = this.#tfcs.findIndex(t => t.id === tfc.id);
//         }
//         if (index >= 0) {
//             const tfcObj = this.#tfcs.splice(index, 1)?.find(t => t != null);
//             this.scene.children.remove(tfcObj.gameObj);
//         }
//         return this;
//     }

//     get tfcs(): TrafficFlowControl<any>[] {
//         return this.#tfcs;
//     }

//     getTfcsWithinRadiusAhead(location: Phaser.Math.Vector2, segment: LaneSegment, distance: number): TrafficFlowControl<any>[] {
//         const distanceToEnd: number = Utils.getLength(location, segment.end);
//         let tfcs: TrafficFlowControl<any>[] = this.tfcs
//             .filter(tfc => tfc.laneSegmentId === segment.id) // only TFCs on `segment`...
//             .filter((tfc) => { // ...only TFCs within `distace` to `location`...
//                 let distToTfc: number = Utils.getLength(location, tfc.location);
//                 return distToTfc <= distance;
//             })
//             .filter((tfc) => { // ...only TFCs closer to `segment` end than `location`
//                 return Utils.getLength(tfc.location, segment.end) <= distanceToEnd;
//             });
//         // if our `distance` is greater than to the end of the `segment` recurse into next available segment(s)
//         if (distanceToEnd < distance) {
//             let segments: LaneSegment[] = this.getSegmentsStartingAt(segment.end);
//             segments.forEach((seg) => {
//                 tfcs.splice(0, 0, ...this.getTfcsWithinRadiusAhead(segment.end, seg, distance - distanceToEnd));
//             });
//         }

//         return tfcs;
//     }

//     addGenerator(generator: VehicleGenerator, segment?: LaneSegment, location?: Phaser.Math.Vector2): this {
//         if (generator) {
//             this.#generators.push(generator);
//         }
//         if (segment) {
//             const loc = location || segment.start;
//             generator.location = loc;
//             generator.lookAt(segment.end);
//             generator.laneSegmentId = segment.id;
//             segment.addGenerator(generator);
//         }
//         return this;
//     }

//     removeGenerator(generator: VehicleGenerator | number): this {
//         let index: number;
//         if (typeof generator === "number") {
//             index = this.#generators.findIndex(g => g.id === generator);
//         } else {
//             index = this.#generators.findIndex(g => g.id === generator.id);
//         }
//         if (index >= 0) {
//             this.#generators.splice(index, 1);
//         }
//         return this;
//     }

//     addSegment(segmentOptions: LaneSegmentOptions): this {
//         segmentOptions.id ??= Utils.getSegmentId();
//         segmentOptions.map ??= this;
//         const segment = new LaneSegment(segmentOptions as LaneSegmentOptions);
//         this.#segments.push(segment);
//         return this;
//     }

//     removeSegment(segment: LaneSegment | number): this {
//         let index: number;
//         if (typeof segment === "number") {
//             index = this.#segments.findIndex(s => s.id === segment);
//         } else {
//             index = this.#segments.findIndex(s => s.id === segment.id);
//         }
//         if (index >= 0) {
//             let seg = this.#segments.splice(index, 1)?.find(s => s != null);
//             this.scene.children.remove(seg.gameObj);
//         }
//         return this;
//     }

// 	get segments(): LaneSegment[] {
// 		return this.#segments;
// 	}

//     getSegmentById(segmentId: number): LaneSegment {
//         const index: number = this.#segments.findIndex(s => s.id === segmentId);
//         if (index >= 0) {
//             return this.#segments[index];
//         }
//         return null;
//     }

// 	getSegmentsStartingAt(location: Phaser.Math.Vector2): LaneSegment[] {
//         if (location) {
//             return this.#segments.filter(seg => Utils.isWithinDistance(seg.start, location, 0.1));
//         }
//     }

//     getSegmentsEndingAt(location: Phaser.Math.Vector2): LaneSegment[] {
//         if (location) {
//             return this.#segments.filter(seg => Utils.isWithinDistance(seg.end, location, 0.1));
//         }
//     }

//     getSegmentsInRoad(roadName: string): LaneSegment[] {
//         return this.#segments.filter((seg) => seg.roadName == roadName);
//     }

//     getSegmentsContainingPoint(point: Phaser.Math.Vector2): LaneSegment[] {
//         var segments = [];
//         for (var i=0; i<this.#segments.length; i++) {
//             var segment = this.#segments[i];
//             let points: Phaser.Math.Vector2[] = [
//                 ...segment.getLaneChangePoints(),
//                 segment.start,
//                 segment.end
//             ];
//             for (var j=0; j<points.length; j++) {
//                 var segmentPoint = points[j];
//                 if (Utils.isWithinDistance(segmentPoint, point, 0.1)) {
//                     segments.push(segment);
//                     break;
//                 }
//             }
//         }
// 		return segments;
// 	}

// 	getSimilarSegmentsInRoad(currentSegmentId: number) {
//         const currentSegment: LaneSegment = this.getSegmentById(currentSegmentId);
// 		return this.getSegmentsInRoad(currentSegment.roadName)
//         .filter((seg) => {
//             let segPoints = seg.getLaneChangePoints();
//             let currPoints = currentSegment.getLaneChangePoints();
//             let closePoints: number = 0;
//             for (var i=0; i<currPoints.length; i++) {
//                 let currPoint = currPoints[i];
//                 for (var j=0; j<segPoints.length; j++) {
//                     let segPoint = segPoints[j];
//                     if (Utils.isWithinDistance(currPoint, segPoint, 10)) {
//                         closePoints++;
//                     }
//                 }
//             }
//             return closePoints > 1;
//         })
//         .filter((seg) => {
//             // if less than 1 degrees variance in lines they're similar so return true
//             return currentSegment.id != seg.id && (Math.abs(Utils.angleFormedBy(seg.line, currentSegment.line)) < 5);
//         });
// 	}

//     shouldStopForVehicles(vehicle: Vehicle): ShouldStopResponse {
//         const ahead: Array<Vehicle> = this.getVehiclesWithinRadiusAhead(
//             vehicle.location, 
//             this.getSegmentById(vehicle.laneSegmentId), 
//             Utils.getStopDistance(vehicle.getSpeed(), vehicle.reactionTime, vehicle.deceleration)
//         ) || [];
//         for (var i=0; i<ahead.length; i++) {
//             let v = ahead[i];
//             if (v.getSpeed() < vehicle.getSpeed()) {
//                 return {stop:true, type: ShouldStopType.vehicle, segmentId: v.laneSegmentId, id: v.id};
//             }
//         }
        
//         var intersecting: Vehicle[] = this.getIntersectingVehicles(vehicle);
//         for (var i=0; i<intersecting.length; i++) {
//             let v: Vehicle = intersecting[i];
//             if (vehicle.hasInView(v)) {
//                 return {stop:true, type: ShouldStopType.vehicle, segmentId: v.laneSegmentId, id: v.id};
//             }
//         }
    
//         return {stop: false};
//     }

//     shouldStopForTfcs(vehicle: Vehicle): ShouldStopResponse {
//         const vehicleSegment: LaneSegment = this.getSegmentById(vehicle.laneSegmentId);
//         var tfcs = this.getTfcsWithinRadiusAhead(vehicle.location, vehicleSegment, Utils.getStopDistance(vehicle.getSpeed(), vehicle.reactionTime, vehicle.deceleration));
//         for (var i=0; i<tfcs.length; i++) {
//             var tfc = tfcs[i];
//             if (tfc.shouldStop(vehicle)) {
//                 return {stop: true, type: ShouldStopType.tfc, segmentId: tfc.laneSegmentId, id: tfc.id};
//             }
//         }
    
//         return {stop: false};
//     }

//     shouldSlowForCorner(vehicle: Vehicle): ShouldStopResponse {
//         // slow down when the next segment is in range and has a different heading
//         const vehicleSegment: LaneSegment = this.getSegmentById(vehicle.laneSegmentId);
//         let distance: number = Utils.getStopDistance(vehicle.getSpeed(), vehicle.reactionTime, vehicle.deceleration);
//         let segEnd: Phaser.Math.Vector2 = vehicleSegment.end;
//         var distanceToSegEnd = Utils.getLength(vehicle.location, segEnd);
//         if (distanceToSegEnd < distance) {
//             // base the amount on how different the heading is
//             var headingDiff = 0;
//             var line1 = vehicleSegment.line;
//             var nextSegments: LaneSegment[] = this.getSegmentsStartingAt(segEnd);
//             // TODO: only calculate for next segment on choosen path
//             for (var i in nextSegments) {
//                 var nextSegment: LaneSegment = nextSegments[i];
//                 var line2 = nextSegment.line;
//                 var angle: number = Math.abs(Utils.angleFormedBy(line1, line2));
//                 if (angle > headingDiff) {
//                     headingDiff = angle;
//                 }
//             }

//             var corneringSpeed: number = Utils.corneringSpeedCalculator(headingDiff);
//             // begin slowing down
//             if (vehicle.getSpeed() > corneringSpeed) {
//                 return { stop: true, type: ShouldStopType.cornering, headingDifference: headingDiff };
//             }
//         }

//         return {stop: false};
//     }

    

//     getTotalDistance(...segments: Array<LaneSegment | number>): number {
//         let totalDistance: number = 0;
//         if (segments?.length) {
//             for (var i=0; i<segments.length; i++) {
//                 const segmentOrSegmentId = segments[i];
//                 let seg: LaneSegment;
//                 if (typeof segmentOrSegmentId === "number") {
//                     seg = this.getSegmentById(segmentOrSegmentId);
//                 } else {
//                     seg = segmentOrSegmentId;
//                 }
//                 totalDistance += seg.length;
//             }
//         }
//         return totalDistance;
//     }

//     getNextSegment(currentSegmentOrId: LaneSegment | number): LaneSegment {
//         let seg: LaneSegment;
//         if (typeof currentSegmentOrId === "number") {
//             seg = this.getSegmentById(currentSegmentOrId);
//         } else {
//             seg = currentSegmentOrId;
//         }
//         const nextSegments: Array<LaneSegment> = this.getSegmentsStartingAt(seg.end);
//         if (nextSegments?.length) {
//             return nextSegments[Utils.getRandomInt(0, nextSegments.length)];
//         } else {
//             return null;
//         }
//     }
// }