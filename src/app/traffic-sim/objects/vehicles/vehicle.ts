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
    private _crashedAt: number; // time when (if) crash occurred
    private _crashCleanupTime: number;

    constructor(options?: VehicleOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.width = options?.width || 2;
        this.length = options?.length || 3;
        this.height = options?.height || 1;
        this.reactionTime = options?.reactionTime || 2.5;
        this.acceleration = options?.acceleration || 3.5;
        this.deceleration = options?.deceleration || 7;
        this.changeLaneDelay = options?.changeLaneDelay || 5;
        
        this._velocity = 0;
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
        v.setPosition(this.getLocation());
        v.setRotation(this.getRotation());

        return v;
    }

    update(elapsedMs: number): void {
        var isStopping: boolean = false;
        var elapsedSeconds: number = (elapsedMs / 1000);
        var shouldRemoveNow = false;

        if (this.shouldStop()) {
            isStopping = true;
        }
        this.updateVelocity(elapsedMs, isStopping);

        var distTraveled = (this.getVelocity() * elapsedSeconds);
        // console.debug(`vehicle '${this.id}' distance travelled is: ${distTraveled}`);
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
                    shouldRemoveNow = true;
                }
            }
        }

        if (shouldRemoveNow) {
            this._simMgr.removeVehicle(this);
        }
        
        if (this.isCrashed()) {
            this.brake(elapsedMs);
            // remove vehicle after
            if (this._crashedAt + this._crashCleanupTime >= this._simMgr.getTotalElapsed()) {
                // remove self from the Simulation
                this._simMgr.removeVehicle(this);
            }
        }
        
        this.moveForwardBy(distTraveled);
    }

    /**
     * returns the speed along the Z axis (fowards / backwards)
     * @returns the speed in Kilometres per second
     */
    getVelocity(): number {
        return this._velocity;
    }

    setCrashed(): void {
        this._crashedAt = new Date().getTime();
        this.getMaterial().color.setHex(0xff0000); // red
    }

    isCrashed(): boolean {
        return this._crashedAt !== null && this._crashedAt !== undefined;
    }

    updateVelocity(elapsedMs: number, isStopping: boolean): void {
        if (this.getSegmentId()) {
            // speed up or slow down
            if (!isStopping && this.getVelocity() < this.getSegment().speedLimit) {
                // speed up: avg. rate of acceleration is 3.5 m/s^2
                this.accelerate(elapsedMs);
            }
            if (isStopping) {
                // slow down: avg. rate of deceleration is 3.5 m/s^2
                this.brake(elapsedMs);
            }
        }
    }

    accelerate(elapsedMs: number): void {
        var elapsedSeconds = elapsedMs/1000;
        this._velocity += (Utils.convertMetresPerSecToKmph(this.acceleration * elapsedSeconds));
        this.getMaterial()?.color.setHex(0x66ff66); // green
    }

    brake(elapsedMs: number): void {
        var elapsedSeconds = elapsedMs/1000;
        this._velocity -= (Utils.convertMetresPerSecToKmph(this.deceleration * elapsedSeconds));
        // prevent going backwards
        if (this.getVelocity() < 0) {
            this._velocity = 0;
        }
        if (this.isCrashed()) {
            this.getMaterial()?.color.setHex(0xff0000); // red
        } else {
            this.getMaterial()?.color.setHex(0xffff00); // yellow
        }
    }

    shouldStop(skipCollisionCheck: boolean = false): boolean {
        if (!skipCollisionCheck) {
            // perform collision check
            var vehicles: Vehicle[] = this._simMgr.getMapManager().getVehiclesWithinRadius(this, this.length * 2);
            vehicles.forEach((vehicle) => {
                if (Utils.isCollidingWith(this, vehicle)) {
                    console.warn(`crash of vehicle: ${this.id} at ${JSON.stringify(this.getLocation())} with vehicle: ${vehicle.id} at ${JSON.stringify(vehicle.getLocation())}`);
                    this.setCrashed();
                    vehicle.setCrashed();
                }
            });
        }
        
        if (this.isCrashed()) {
            return true;
        }

        var dist: number = this.getLookAheadDistance();
        
        // check for vehicles in range
        var foundV: ShouldStopResponse = this.shouldStopForVehicle(dist);
        if (foundV && foundV.stop) {
            var changingLanes = this.changeLanesIfAvailable();
            if (changingLanes) {
                return false;
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: ShouldStopResponse = this.shouldStopForTfc(dist);
        if (foundTfc && foundTfc.stop) {
            // console.debug(`vehicle ${this.id} should stop for tfc ${foundTfc.id}`);
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
            var vehicles: Vehicle[] = this._simMgr.getMapManager()
                .getVehiclesWithinRadiusAhead(this.getLocation(), this.getSegment(), distance);
            for (var i=0; i<vehicles.length; i++) {
                let v: Vehicle = vehicles[i];
                if (v.id !== this.id) {
                    return {stop:true, type: ShouldStopType.vehicle, segmentId: v.getSegmentId(), id: v.id};
                }
            }
        }
    
        return {stop: false};
    }

    shouldStopForTfc(distance: number): ShouldStopResponse {
        if (distance > 0) {
            var tfcs = this._simMgr.getMapManager().getTfcsWithinRadiusAhead(this.getLocation(), this.getSegment(), distance);
            for (var i=0; i<tfcs.length; i++) {
                var tfc = tfcs[i];
                if (tfc.shouldStop(this)) {
                    return {stop: true, type: ShouldStopType.tfc, segmentId: tfc.getSegmentId(), id: tfc.id};
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
                        // TODO: base angle on speed where greater angles allowed at lower speeds
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
                tmpV.setPosition(seg.getStart());
                tmpV.lookAt(seg.getEnd());
                if (!tmpV.shouldStop(true)) {
                    this.setSegmentId(seg.id);
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

    hasInView(otherVehicle: Vehicle): boolean {
        var maxAngle = 45;
        if (this._isChangingLanes) {
            maxAngle = 90;
        }
        let otherLoc: Vector3 = otherVehicle.getLocation();
        var headingLine = new Line3(this.getLocation(), this.getSegment().getEnd());
        var headingToLocation = new Line3(this.getLocation(), otherLoc);

        if (Math.abs(Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
            return true;
        }
        return false;
    }

    /**
     * time to stop from current velocity:
     * t = vf-vi/a
     * 
     * distance travelled over time:
     * vf^2−vi^2=2ad | d = (vf^2-vi^2)/2a
     * d = (t/vi)/2
     * 
     * vf = desired velocity (0 metres/second)
     * vi = current velocity (metres/second)
     * a = acceleration (metres/second)
     * d = distance (metres)
     */
    getLookAheadDistance(): number { 
        var mps = Utils.convertKmphToMetresPerSec(this.getVelocity());
        let time: number = mps / this.deceleration;
        let dist: number = (Math.pow(mps, 2)) / (2 * this.deceleration)
        // var distanceToStop = (-(Math.pow(mps, 2)) / (2 * -(this.deceleration))) / 2;
        // var distanceToReact = this.reactionTime * mps;
        // var distanceTot = distanceToStop + (this.length * 2) + distanceToReact;
        return (dist + this.length) * 1.5;
    }

    protected generateMesh(): Object3D {
        if (!this._obj3D) {
            var geometry = new BoxGeometry(this.width, this.height, this.length);
            var mesh = new Mesh(geometry, this._material);
            return mesh;
        }
    }
}