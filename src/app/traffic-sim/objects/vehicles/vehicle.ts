import { Mesh, BoxGeometry, MeshBasicMaterial, Box3, Line3, Vector3, Object3D } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject } from "../traffic-object";
import { TrafficObjectOptions } from "../traffic-object-options";
import { ShouldStopResponse } from "./should-stop-response";
import { ShouldStopType } from "./should-stop-type";
import { VehicleOptions } from "./vehicle-options";

export class Vehicle extends TrafficObject {
    readonly width: number; // 2,
    readonly length: number; // 4,
    readonly height: number; // 2,
    readonly reactionTime: number; // 2.5, // seconds to react
    readonly acceleration: number; // 3.5, // meters per second
    readonly deceleration: number; // 7, // meters per second
    readonly changeLaneDelay: number; // 5 // don't change lanes for 5 seconds after a change

    private _isChangingLanes: boolean;
    private _changeLaneTime: number;
    private _velocity: number; // Km/h
    crashed: boolean;
    private _crashCleanupTime: number;

    constructor(options?: VehicleOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.width = options?.width;
        this.length = options?.length;
        this.height = options?.height;
        this.reactionTime = options?.reactionTime;
        this.acceleration = options?.acceleration;
        this.deceleration = options?.deceleration;
        this.changeLaneDelay = options?.changeLaneDelay;
    }

    clone(): Vehicle {
        let v = new Vehicle({
            id: this.id,
            name: this.name,
            width: this.width,
            length: this.length,
            height: this.height,
            reactionTime: this.reactionTime,
            acceleration: this.acceleration,
            deceleration: this.deceleration,
            changeLaneDelay: this.changeLaneDelay
        });
        v.moveTo(this.getLocation());
        v.setRotation(this.getRotation());

        return v;
    }

    update(elapsedMs: number): void {
        var isStopping: boolean = false;
        var elapsedSeconds: number = (elapsedMs / 1000);
        var removed = false;

        if (this.shouldStop()) {
            isStopping = true;
        }
        this.updateVelocity(elapsedMs, isStopping);

        var distTraveled = (this.getVelocity() * elapsedSeconds);
        if(distTraveled > 0) {
            var remainingDistOnSegment = Utils.getDistanceBetweenTwoPoints(this.getLocation(), this.getSegment().getEnd());
            if (distTraveled >= remainingDistOnSegment) {
                // if there is a next Segment
                var nextSegments: RoadSegment[];
                if (this._isChangingLanes) {
                    this._isChangingLanes = false;
                    nextSegments = this._simMgr.getMapManager().getSegmentsContainingPoint(this.getSegment().getEnd());
                } else {
                    nextSegments = this._simMgr.getMapManager().getSegmentsStartingAt(this.getSegment().getEnd());
                }

                if(nextSegments && nextSegments.length > 0){
                    // move to segment (pick randomly)
                    // TODO: lookup values from vehicle's choosen path
                    var randIndex = Math.floor((Math.random() * nextSegments.length));
                    var nextSeg: RoadSegment = nextSegments[randIndex];
                    nextSeg.addVehicle(this);

                    distTraveled -= remainingDistOnSegment;
                } else{
                    // TODO: set flag indicating SimulationManager should cleanup vehicle
                    removed = true;
                }
            }
        }

        if (!removed) {
            if (this.crashed) {
                this.brake(elapsedMs);
                if (this._crashCleanupTime) {
                    // remove vehicle after
                    if (this._crashCleanupTime <= this._simMgr.getTotalElapsed()) {
                        // remove self from the Simulation
                        console.log("Vehicle removed: "+this.id);
                        this._simMgr.getMapManager().getSegmentById(this.getSegmentId()).removeVehicle(this.id);
                    }
                } else {
                    console.log("Vehicle crashed: "+this.id);
                    var rand = Math.random();
                    if (rand <= 0.8) {
                        this._crashCleanupTime = Math.random() * this._simMgr.CRASH_CLEANUP_MIN_DELAY;
                    }
                    this._crashCleanupTime = Math.random() * (this._simMgr.CRASH_CLEANUP_MAX_DELAY - this._simMgr.CRASH_CLEANUP_MIN_DELAY) + this._simMgr.CRASH_CLEANUP_MIN_DELAY;
                }
            } else {
                this.moveBy(distTraveled);
            }
        }
    }

    getVelocity(): number {
        return this._velocity;
    }

    updateVelocity(elapsedMs: number, isStopping: boolean): void {
        if (this.getSegment()) {
            // speed up or slow down
            if (this.getVelocity() < this.getSegment().speedLimit && !isStopping) {
                // speed up: avg. rate of acceleration is 3.5 m/s^2
                this.accelerate(elapsedMs);
            }
            if (this.getVelocity() > this.getSegment().speedLimit || isStopping) {
                // slow down: avg. rate of deceleration is 3.5 m/s^2
                this.brake(elapsedMs);
            }
        }
    }

    accelerate(elapsedMs: number): void {
        var elapsedSeconds = elapsedMs/1000;
        this._velocity += (Utils.convertMpsToKmph(this.acceleration * elapsedSeconds));
        (this.getMesh().material as MeshBasicMaterial).color.setHex(0x66ff66); // green
    }

    brake(elapsedMs: number): void {
        var elapsedSeconds = elapsedMs/1000;
        this._velocity -= (Utils.convertMpsToKmph(this.deceleration * elapsedSeconds));
        // prevent going backwards
        if (this.getVelocity() < 0) {
            this._velocity = 0;
        }
        (this.getMesh().material as MeshBasicMaterial).color.setHex(0xff0000); // red
    }

    shouldStop(distance?: number, segment?: RoadSegment, skipCollisionCheck: boolean = false): boolean {
        if (!segment) {
            segment = this._simMgr.getMapManager().getSegmentById(this.getSegmentId());
        }
    
        var dist = distance || this.getLookAheadDistance();
        // check for vehicles in range
        var foundV = this.shouldStopForVehicle(dist);
        if (foundV && foundV.stop) {
            if (skipCollisionCheck) {
                return foundV.stop;
            } else {
                // perform collision check
                var box1 = new Box3().setFromObject(this.getObj3D());
                var vehicle: Vehicle = this._simMgr.getMapManager().getVehicleById(foundV.id);
                var box2 = new Box3().setFromObject(vehicle.getObj3D());
                if (Utils.isCollidingWith(box1, box2)) {
                    this.crashed = true;
                    vehicle.crashed = true;
                } else {
                    var changingLanes = this.changeLanesIfAvailable();
                    if (!changingLanes) {
                        return foundV.stop;
                    }
                }
            }
        }
        // check for traffic flow controllers
        var foundTfc = this.shouldStopForTfc(dist);
        if (foundTfc && foundTfc.stop) { // and then check for traffic lights in range
            return foundTfc.stop;
        }
        // check for corners
        var foundCorner = this.shouldSlowForCorner(dist);
        if (foundCorner && foundCorner.stop) { // and finally check for cornering in range
            return foundCorner.stop;
        }
    }

    shouldStopForVehicle(distance: number): ShouldStopResponse {
        if (distance > 0) {
            var vehicles: Vehicle[] = this._simMgr.getMapManager().getVehiclesWithinRadius(this, distance);
            /*jshint loopfunc:true*/
            for (var i=0; i<vehicles.length; i++) {
                let v: Vehicle = vehicles[i];
                if (v.id !== this.id) {
                    if (this.hasInView(v)) {
                        // check if v is in current segment
                        if (v.getSegment() === this.getSegment()) {
                            return { stop: true, type: ShouldStopType.vehicle, id: v.id };
                        }
                        // check if v is in intersecting segment
                        let currentSegment: RoadSegment = this._simMgr.getMapManager().getSegmentById(this.getSegmentId());
                        var connectedTo = this._simMgr.getMapManager().getSegmentsContainingPoint(currentSegment.getEnd()).filter(function (seg) {
                            return seg.id !== v.getSegmentId();
                        });
                        var containing = connectedTo.filter(function (seg) { return seg.id === v.getSegmentId(); });
                        if (v.getSegment() && containing.length > 0) {
                            return { stop: true, type: ShouldStopType.vehicle, id: v.id };
                        } else {
                            // check for vehicles on segments ahead
                            var distToSegEnd = Utils.getDistanceBetweenTwoPoints(this.getLocation(), currentSegment.getEnd());
                            if (distToSegEnd < distance) {
                                var found: ShouldStopResponse = {stop: false};
                                for (var j=0; j<connectedTo.length; j++) {
                                    var s: RoadSegment = connectedTo[j];
                                    var tmpV = this.clone();
                                    s.addVehicle(tmpV);
                                    found = tmpV.shouldStopForVehicle(distance - distToSegEnd);
                                    tmpV.disposeGeometry();
                                    if (found && found.stop) {
                                        return found;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    
        return {stop: false};
    }

    shouldStopForTfc(distance: number): ShouldStopResponse {
        if (distance > 0) {
            var tfcs = this._simMgr.getMapManager().getTfcsWithinRadiusOnSegment(this, distance, this.getSegmentId());
            for (var i=0; i<tfcs.length; i++) {
                var tfc = tfcs[i];
                if (tfc.shouldStop(this)) {
                    return { stop: true, type: ShouldStopType.tfc, segmentId: tfc.getSegmentId(), id: tfc.id };
                }
            }
        }
    
        return {stop: false};
    }

    changeLanesIfAvailable(): boolean {
        if (!this._changeLaneTime || this._changeLaneTime < this._simMgr.getTotalElapsed()) {
            var closestPoint = null;
            if (this.getSegment()) {
                var possibleLanes: RoadSegment[] = this._simMgr.getMapManager().getSimilarSegmentsInRoad(this.getSegment());
                for (var i in possibleLanes) {
                    var possibleLane = possibleLanes[i];
                    // check angle to all change points on possible lane
                    let points: Vector3[] = possibleLane.getLaneChangePoints();
                    for (var j=0; j<points.length; j++) {
                        var point = points[j];
                        var line1 = new Line3(this.getLocation(), point);
                        var line2 = this.getSegment().getLine();
                        var angle = Math.abs(Utils.angleFormedBy(line1, line2));
                        if (angle <= 25 && angle > 5) {
                            if (!closestPoint) {
                                closestPoint = point;
                            } else {
                                if (line1.distance() <
                                    Utils.getDistanceBetweenTwoPoints(closestPoint, this.getLocation())) {
                                    closestPoint = point;
                                }
                            }
                        }
                    }
                }
            }
    
            if (closestPoint) {
                // create tmp segment to new lane
                var seg = new RoadSegment({
                    start: this.getLocation(),
                    end: closestPoint,
                    speedLimit: this.getSegment().speedLimit
                });
                var tmpV = this.clone();
                tmpV.setSegmentId(seg.id);
                tmpV._isChangingLanes = true;
                tmpV.moveTo(seg.getStart());
                tmpV.lookAt(seg.getEnd());
                // don't change lanes if we just have to stop on the new lane too
                var distance = this.getLookAheadDistance() * 2;
                if (!tmpV.shouldStop(distance, seg, true)) {
                    this.setSegmentId(seg.id);
                    this.moveTo(seg.getStart());
                    this.lookAt(seg.getEnd());
                    this._changeLaneTime = this._simMgr.getTotalElapsed() + (this.changeLaneDelay * 1000);
                    this._isChangingLanes = true;
                    return true;
                }
                tmpV.disposeGeometry();
            }
        }
    
        return false;
    }

    shouldSlowForCorner(distance: number): ShouldStopResponse {
        // slow down when the next segment is in range and has a different heading
        var distanceToSegEnd = Utils.getDistanceBetweenTwoPoints(this.getLocation(), this.getSegment().getEnd());
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1 = this.getSegment().getLine();
            var nextSegments = this._simMgr.getMapManager().getSegmentsStartingAt(this.getSegment().getEnd());
            for (var i in nextSegments) {
                var nextSegment = nextSegments[i];
                var line2 = nextSegment.getLine();
                var tmp = Math.abs(Utils.angleFormedBy(line1, line2));
                if (tmp > headingDiff) {
                    headingDiff = tmp;
                }
            }

            var corneringSpeed: number = Utils.corneringSpeedCalculator(headingDiff);
            // begin slowing down
            if (this.getVelocity() > corneringSpeed) {
                return { stop: true, type: ShouldStopType.cornering, headingDifference: headingDiff };
            }
        }

        return {stop: false};
    }

    hasInView<T extends TrafficObject>(tObj: T): boolean {
        var maxAngle = 45;
        if (this._isChangingLanes) {
            maxAngle = 90;
        }
        var vertices = ((tObj.getObj3D() as Mesh).geometry.attributes["position"] as any as Array<Vector3>).map(function (v) {
            return new Vector3().copy(v).applyMatrix4(tObj.getObj3D().matrix);
        });
        for (var i in vertices) {
            var location = vertices[i];
            var headingLine = new Line3(this.getLocation(), this.getSegment().getEnd());
            var headingToLocation = new Line3(this.getLocation(), location);

            if (Math.abs(Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
                return true;
            }
        }
        return false;
    }

    /**
     * distance to decelerate from current velocity to 0
     * (2) d = -u² / 2a
     * v = desired velocity (0 mps)
     * u = current velocity (mps)
     * a = acceleration (mps)
     * d = distance (m)
     */
    getLookAheadDistance(): number { 
        var mps = Utils.convertKmphToMps(this.getVelocity());
        var distanceToStop = (-(Math.pow(mps, 2)) / (2 * -(this.deceleration))) / 2;
        var distanceToReact = this.reactionTime * mps;
        var distanceTot = distanceToStop + (this.length * 2) + distanceToReact;
        // TODO: use distanceToReact as a setTimeout for when to check distances again
        return distanceTot;
    }

    protected generateMesh(): Object3D {
        if (!this._obj3D) {
            var geometry = new BoxGeometry(this.width, this.height, this.length);
            var mesh = new Mesh(geometry, this._material);
            return mesh;
        }
    }
}