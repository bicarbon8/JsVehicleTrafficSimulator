import { Mesh, BoxGeometry, Line3, Vector3, Object3D, Box3, Quaternion } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject } from "../traffic-object";
import { TrafficObjectOptions } from "../traffic-object-options";
import { ShouldStopResponse } from "./should-stop-response";
import { VehicleOptions } from "./vehicle-options";

export class Vehicle extends TrafficObject {
    /**
     * width of vehicle in Metres (defaults to 2)
     */
    readonly width: number;
    /**
     * length of vehicle in Metres (defaults to 3)
     */
    readonly length: number;
    /**
     * height of vehicle in Metres (defaults to 1.5)
     */
    readonly height: number;
    /**
     * milliseconds taken to react to events (defaults to 2500 ms)
     */
    readonly reactionTime: number;
    /**
     * acceleration in Metres per Second (defaults to 2.78 mps)
     */
    readonly acceleration: number;
    /**
     * deceleration in Metres per Second (defaults to 6.94 mps)
     */
    readonly deceleration: number;
    /**
     * amount of time after changing lanes before considering changing again in milliseconds (defaults to 5000 ms)
     */
    readonly changeLaneDelay: number;
    /**
     * maximum velocity vehicle can go in Kilometres per Hour (defaults to 260)
     */
    readonly maxSpeed: number;

    /**
     * indicates if the vehicle is in the process of changing lanes
     */
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
        this.height = options?.height || 1.5; // metres
        this.reactionTime = options?.reactionTime || 2500; // milliseconds
        this.acceleration = options?.acceleration || 2.78; // Metres per Second
        this.deceleration = options?.deceleration || 6.94; // Metres per Second
        this.changeLaneDelay = options?.changeLaneDelay || 30000; // milliseconds
        this.maxSpeed = options?.maxSpeed || 260; // Kilometres per Hour
        
        this._velocity = options?.startingVelocity || 0; // Metres per Second
        this._changeLaneTime = this.changeLaneDelay;
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
            maxSpeed: this.maxSpeed,
            startingVelocity: this.getVelocity()
        });
        v.setPosition(this.getLocation());
        v.setRotation(this.getRotation());

        return v;
    }

    update(elapsedMs: number): void {
        // console.info(`velocity: ${this.getVelocity()}`);
        this.updateVelocity(elapsedMs);
        let distTravelled: number = Utils.getDistanceTravelled(this.getVelocity(), elapsedMs);

        // check if we should move to next RoadSegment or remove vehicle from the simulation
        if(distTravelled > 0) {
            let currentSegment: RoadSegment = this.getSegment();
            if (currentSegment) {
                let remainingDistOnSegment: number = Utils.getLength(this.getLocation(), currentSegment.getEnd());
                if (distTravelled >= remainingDistOnSegment) {
                    // if there is a next Segment
                    let nextSegments: RoadSegment[];
                    if (this.isChangingLanes()) { // then we've finished changing lanes
                        this.setChangingLanes(false);
                        this._simMgr.getMapManager().removeSegment(this.getSegmentId());
                        nextSegments = this._simMgr.getMapManager().getSegmentsContainingPoint(currentSegment.getEnd());
                    } else {
                        nextSegments = this._simMgr.getMapManager().getSegmentsStartingAt(currentSegment.getEnd());
                    }

                    if(nextSegments?.length) {
                        // move to segment (pick randomly)
                        // TODO: lookup values from vehicle's choosen path
                        var randIndex = Math.floor((Math.random() * nextSegments.length));
                        var nextSeg: RoadSegment = nextSegments[randIndex];
                        nextSeg.addVehicle(this, currentSegment.getEnd());

                        distTravelled -= remainingDistOnSegment;
                    } else {
                        // end of Road reached... remove vehicle from Simulation
                        this._simMgr.removeVehicle(this);
                        return;
                    }
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

    updateVelocity(elapsedMs: number): void {
        // speed up or slow down
        if (this.shouldDecelerate()) {
            this.brake(elapsedMs);
        } else {
            this.accelerate(elapsedMs);
        }
    }

    /**
     * returns the speed along the Z axis (fowards / backwards)
     * @returns the speed in Metres per Second
     */
    getVelocity(): number {
        return this._velocity;
    }

    setCrashed(): void {
        this._crashedAt = this._simMgr.getTotalElapsed();
        this.getMaterial().color.setHex(0xff0000); // red
    }

    isCrashed(): boolean {
        return this._crashedAt !== null && this._crashedAt !== undefined;
    }

    setChangingLanes(isChanging: boolean): void {
        this._isChangingLanes = isChanging;
        if (this.isChangingLanes()) {
            this._changeLaneTime = this._simMgr.getTotalElapsed() + this.changeLaneDelay;
        }
    }

    isChangingLanes(): boolean {
        return this._isChangingLanes;
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

    shouldDecelerate(skipCollisionCheck: boolean = false): boolean {
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
        
        // check for vehicles in range
        var foundV: ShouldStopResponse = this._simMgr.getMapManager().shouldStopForVehicles(this);
        if (foundV && foundV.stop) {
            let lane: RoadSegment = this.shouldChangeLanes(foundV.id);
            if (lane) {
                let changeLaneSegment: RoadSegment = this._simMgr.getMapManager().createChangeLaneSegment(this.getLocation(), lane);
                if (changeLaneSegment) {
                    this.setChangingLanes(true);
                    changeLaneSegment.addVehicle(this);
                    return false; // no deceleration needed because we're changing lanes
                }
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: ShouldStopResponse = this._simMgr.getMapManager().shouldStopForTfcs(this);
        if (foundTfc && foundTfc.stop) {
            // console.debug(`vehicle ${this.id} should stop for tfc ${foundTfc.id}`);
            return foundTfc.stop;
        }

        // check for corners
        var foundCorner = this._simMgr.getMapManager().shouldSlowForCorner(this);
        if (foundCorner && foundCorner.stop) { // and finally check for cornering in range
            return foundCorner.stop;
        }
    }

    shouldChangeLanes(obstructingVehicleId: number): RoadSegment {
        let newLane: RoadSegment;
        if (! this.isChangingLanes() && this._changeLaneTime < this._simMgr.getTotalElapsed()) {
            let availableLanes: RoadSegment[] = this._simMgr.getMapManager().getSimilarSegmentsInRoad(this.getSegment());
            let obstructingVehicle: Vehicle = this._simMgr.getMapManager().getVehicleById(obstructingVehicleId);
            for (var i=0; i<availableLanes.length; i++) {
                let availableLane: RoadSegment = availableLanes[i];
                // ensure availableLane is clear ahead
                let vehicles: Vehicle[] = this._simMgr.getMapManager()
                    .getVehiclesWithinRadiusAhead(this.getLocation(), availableLane, this.getLookAheadDistance()).filter((veh) => {
                        return this.id != veh.id;
                    });
                if (vehicles.length > 0) {
                    for (var j=0; j<vehicles.length; j++) {
                        let veh: Vehicle = vehicles[j];
                        if (veh.getVelocity() > obstructingVehicle.getVelocity()) {
                            newLane = availableLane;
                            break;
                        }
                    }
                } else {
                    newLane = availableLane;
                }
                if (newLane) {
                    // ensure no vehicles nearby in lane
                    let nearby: Vehicle[] = this._simMgr.getMapManager()
                        .getVehiclesWithinRadius(this, this.getLookAheadDistance() * 2)
                        .filter((veh) => {
                            return veh.getSegmentId() != this.getSegmentId();
                        });
                    if (nearby?.length > 0) {
                        continue;
                    } else {
                        break;
                    }
                }
            }
        }
        return newLane;
    }

    hasInView(otherVehicle: Vehicle): boolean {
        if (this.getSegment()) {
            var maxAngle = 45;
            if (this.getSegment()?.isInlet) {
                maxAngle = 90;
            }
            let otherLoc: Vector3 = otherVehicle.getLocation();
            var headingLine = new Line3(this.getLocation(), this.getSegment()?.getEnd());
            var headingToLocation = new Line3(this.getLocation(), otherLoc);

            if (Math.abs(Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
                return true;
            }
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
     * `Vf` = desired velocity (0 Metres per Second)
     * `Vi` = current velocity (Metres per Second)
     * `d` = distance (Metres)
     * `t` = time (Seconds)
     * @returns the distance required to safely stop in metres
     */
    getLookAheadDistance(): number { 
        var vel = this.getVelocity(); // Metres per Second
        let time: number = vel / this.deceleration; // Seconds
        let distanceToStop: number = (vel / 2) * time; // metres
        // var distanceToReact = this.reactionTime * mps;
        let total: number = distanceToStop + (this.length * 2);
        return total;
    }

    getLookAheadCollisionBox(): Box3 {
        let dist: number = this.getLookAheadDistance();
        let mesh: Mesh = new Mesh(new BoxGeometry(this.width, this.height, dist));
        let pos: Vector3 = this.getLocation();
        let rot: Quaternion = this.getRotation();
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.rotation.setFromQuaternion(rot);
        mesh.translateZ(dist / 2);
        let lookAheadCollisionBox: Box3 = new Box3().setFromObject(mesh);
        mesh.geometry.dispose();
        return lookAheadCollisionBox;
    }

    protected generateMesh(): Object3D {
        if (!this._obj3D) {
            var geometry = new BoxGeometry(this.width, this.height, this.length);
            var mesh = new Mesh(geometry, this._material);
            return mesh;
        }
    }
}