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
    /**
     * width of vehicle in Metres
     */
    readonly width: number;
    /**
     * length of vehicle in Metres
     */
    readonly length: number;
    /**
     * height of vehicle in Metres
     */
    readonly height: number;
    /**
     * milliseconds taken to react to events
     */
    readonly reactionTime: number;
    /**
     * acceleration in Metres per Second
     */
    readonly acceleration: number;
    /**
     * deceleration in Metres per Second
     */
    readonly deceleration: number;
    /**
     * amount of time after changing lanes before considering changing again in milliseconds
     */
    readonly changeLaneDelay: number;
    /**
     * maximum velocity vehicle can go in Kilometres per Hour
     */
    readonly maxSpeed: number;

    private _isChangingLanes: boolean;
    /**
     * time when we should consider changing lanes again if blocked
     */
    private _changeLaneTime: number;
    /**
     * velocity in Metres per Second
     */
    private _velocity: number;
    /**
     * time when (if) a crash occurred
     */
    private _crashedAt: number;
    /**
     * time when vehicle should be removed from simulation following crash
     */
    private _crashCleanupTime: number;

    constructor(options?: VehicleOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this.width = options?.width || 2; // metres
        this.length = options?.length || 3; // metres
        this.height = options?.height || 1; // metres
        this.reactionTime = options?.reactionTime || 2500; // milliseconds
        this.acceleration = options?.acceleration || 2.78; // Metres per Second
        this.deceleration = options?.deceleration || 6.94; // Metres per Second
        this.changeLaneDelay = options?.changeLaneDelay || 5000; // milliseconds
        this.maxSpeed = options?.maxSpeed || 260; // Kilometres per Hour
        
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
            changeLaneDelay: this.changeLaneDelay,
            maxSpeed: this.maxSpeed
        });
        v.setPosition(this.getLocation());
        v.setRotation(this.getRotation());

        return v;
    }

    update(elapsedMs: number): void {
        // console.info(`velocity: ${this.getVelocity()}`);
        let isStopping: boolean = this.shouldStop();
        this.updateVelocity(elapsedMs, isStopping);
        let distTravelled: number = Utils.getDistanceTravelled(this.getVelocity(), elapsedMs);

        // check if we should move to next RoadSegment or remove vehicle from the simulation
        if(distTravelled > 0) {
            let remainingDistOnSegment: number = Utils.getLength(this.getLocation(), this.getSegment().getEnd());
            if (distTravelled >= remainingDistOnSegment) {
                // if there is a next Segment
                let nextSegments: RoadSegment[];
                if (this._isChangingLanes) { // then we've finished changing lanes
                    this._isChangingLanes = false;
                    nextSegments = this._simMgr.getMapManager().getSegmentsContainingPoint(this.getSegment().getEnd());
                } else {
                    nextSegments = this._simMgr.getMapManager().getSegmentsStartingAt(this.getSegment().getEnd());
                }

                if(nextSegments && nextSegments.length > 0) {
                    // move to segment (pick randomly)
                    // TODO: lookup values from vehicle's choosen path
                    var randIndex = Math.floor((Math.random() * nextSegments.length));
                    var nextSeg: RoadSegment = nextSegments[randIndex];
                    nextSeg.addVehicle(this, this.getSegment().getEnd());

                    distTravelled -= remainingDistOnSegment;
                } else {
                    // end of Road reached... remove vehicle from Simulation
                    this._simMgr.removeVehicle(this);
                    return;
                }
            }
        }
        
        if (this.isCrashed()) {
            // remove vehicle after appropriate time has passed
            if (this._crashedAt + this._crashCleanupTime >= this._simMgr.getTotalElapsed()) {
                // remove self from the Simulation
                this._simMgr.removeVehicle(this);
                return;
            }
        }
        
        this.moveForwardBy(distTravelled);
    }

    /**
     * returns the speed along the Z axis (fowards / backwards)
     * @returns the speed in Metres per Second
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
        // speed up or slow down
        if (isStopping || this.isCrashed()) {
            this.brake(elapsedMs);
        } else {
            this.accelerate(elapsedMs);
        }
    }

    /**
     * if this vehicle is not exceeding its {maxVelocity} and the
     * {RoadSegment.speedLimit} the current velocity will be increased
     * using the following formula:
     * `Vf = Vi + A * t`
     * 
     * where:
     * `Vf` is the final velocity in Metres per Second
     * `Vi` is the current velocity in Metres per Second
     * `A` is the {acceleration} in Metres per Second
     * `t` is the elapsed time in Seconds
     * @param elapsedMs amount of time, in milliseconds, elapsed since last update
     */
    accelerate(elapsedMs: number): void {
        let velKph: number = Utils.convertMetresPerSecToKmph(this.getVelocity());
        if (velKph < this.maxSpeed && velKph < this.getSegment()?.speedLimit) {
            let elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
            this._velocity += this.acceleration * elapsedSeconds;
            this.getMaterial()?.color.setHex(0x66ff66); // green
        }
    }

    brake(elapsedMs: number): void {
        var elapsedSeconds = Utils.convertMillisecondsToSeconds(elapsedMs);
        this._velocity -= this.deceleration * elapsedSeconds;
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
        if (this.isCrashed()) {
            return true;
        }
        
        if (!skipCollisionCheck) {
            // perform collision check
            var vehicles: Vehicle[] = this._simMgr.getMapManager().getVehiclesWithinRadius(this, this.length * 2);
            vehicles.forEach((vehicle) => {
                if (Utils.isCollidingWith(this, vehicle)) {
                    console.warn(`crash of vehicle: ${this.id} at ${JSON.stringify(this.getLocation())} with vehicle: ${vehicle.id} at ${JSON.stringify(vehicle.getLocation())}`);
                    if (!this.isCrashed()) { this.setCrashed(); }
                    if (!vehicle.isCrashed()) { vehicle.setCrashed(); }
                }
            });
        }

        // check again as we may have crashed
        if (this.isCrashed()) {
            return true;
        }

        var lookAheadDist: number = this.getLookAheadDistance();
        
        // check for vehicles in range
        var foundV: ShouldStopResponse = this.shouldStopForVehicle(lookAheadDist);
        if (foundV && foundV.stop) {
            var changingLanes = this.changeLanesIfAvailable();
            if (changingLanes) {
                return false;
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: ShouldStopResponse = this.shouldStopForTfc(lookAheadDist);
        if (foundTfc && foundTfc.stop) {
            // console.debug(`vehicle ${this.id} should stop for tfc ${foundTfc.id}`);
            return foundTfc.stop;
        }

        // check for corners
        var foundCorner = this.shouldSlowForCorner(lookAheadDist);
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
                                    Utils.getLength(closestPoint, this.getLocation())) {
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
                    this._changeLaneTime = this._simMgr.getTotalElapsed() + this.changeLaneDelay;
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
        var distanceToSegEnd = Utils.getLength(this.getLocation(), this.getSegment().getEnd());
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
     * `t = (Vf - Vi) / A`
     * 
     * distance travelled over time:
     * `d = ((Vf + Vi) / 2) * t`
     * 
     * Vf = desired velocity (0 Metres per Second)
     * Vi = current velocity (Metres per Second)
     * d = distance (Metres)
     * t = time (Seconds)
     * @returns the distance required to safely stop in metres
     */
    getLookAheadDistance(): number { 
        var vel = this.getVelocity(); // Metres per Second
        let time: number = vel / this.deceleration; // Seconds
        let dist: number = (vel / 2) * time; // metres
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