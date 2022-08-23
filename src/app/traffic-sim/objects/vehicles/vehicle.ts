import { Mesh, BoxGeometry, Line3, Vector3, Object3D, Box3, Quaternion } from "three";
import { SimulationConstants } from "../../helpers/simulation-constants";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { ShouldStopResponse } from "./should-stop-response";

export type VehicleOptions = TrafficObjectOptions & {
    /**
     * vehicle width in metres
     */
    width?: number;
    /**
     * vehicle length in metres
     */
    length?: number;
    /**
     * vehicle height in metres
     */
    height?: number;
    /**
     * milliseconds to react
     */
    reactionTime?: number;
    /**
     * acceleration in Metres per Second
     */
    acceleration?: number;
    /**
     * deceleration in Metres per Second
     */
    deceleration?: number;
    /**
     * minimum time in milliseconds to wait after changing lanes before changing again
     */
    changeLaneDelay?: number;
    /**
     * maximum speed this vehicle can sustain in Kilometres per Hour
     */
    maxSpeed?: number;
    /**
     * the starting speed along the forward trajectory for this vehicle
     */
    startingVelocity?: number;
}

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
     * milliseconds taken to react to events (defaults to 750 ms)
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
    #isChangingLanes: boolean;
    /**
     * time when we should consider changing lanes again if blocked
     */
    #changeLaneTime: number;
    /**
     * velocity in Metres per Second
     */
    #velocity: number;
    /**
     * time when (if) a crash occurred
     */
    #crashedAt: number;
    /**
     * time when vehicle should be removed from simulation following crash
     */
    #crashCleanupTime: number;

    constructor(options: VehicleOptions) {
        super(options as TrafficObjectOptions);
        this.width = options?.width || 2; // metres
        this.length = options?.length || 3; // metres
        this.height = options?.height || 1.5; // metres
        this.reactionTime = options?.reactionTime || Utils.getRandomBetween(
            SimulationConstants.Vehicles.ReactionTime.min,
            SimulationConstants.Vehicles.ReactionTime.max
        ); // milliseconds
        this.acceleration = options?.acceleration || Utils.getRandomBetween(
            SimulationConstants.Vehicles.Acceleration.min,
            SimulationConstants.Vehicles.Acceleration.max
        ); // Metres per Second
        this.deceleration = options?.deceleration || Utils.getRandomBetween(
            SimulationConstants.Vehicles.Deceleration.min,
            SimulationConstants.Vehicles.Deceleration.max
        ); // Metres per Second
        this.changeLaneDelay = options?.changeLaneDelay || Utils.getRandomBetween(
            SimulationConstants.Vehicles.ChangeLaneDelay.min,
            SimulationConstants.Vehicles.ChangeLaneDelay.max
        ); // milliseconds
        this.maxSpeed = options?.maxSpeed || 260; // Kilometres per Hour
        
        this.#velocity = options?.startingVelocity || 0; // Metres per Second
        this.#changeLaneTime = Date.now() + this.changeLaneDelay;
    }

    clone(): Vehicle {
        let v = new Vehicle({
            id: this.id,
            map: this.map,
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
        const distTravelled: number = Utils.getDistanceTravelled(this.getVelocity(), elapsedMs);
        this.updateVelocity(elapsedMs);
        let remaining = distTravelled;

        // check if we should move to next RoadSegment or remove vehicle from the simulation
        while (remaining > 0) {
            let currentSegment: RoadSegment = this.map.getSegmentById(this.getSegmentId());
            let currentSegmentEnd = currentSegment.getEnd();
            if (currentSegment) {
                let remainingDistOnSegment: number = Utils.getLength(this.getLocation(), currentSegmentEnd);
                if (remaining >= remainingDistOnSegment) {
                    this.moveForwardBy(remainingDistOnSegment);
                    remaining -= remainingDistOnSegment;
                    // if there is a next Segment
                    let nextSegments: RoadSegment[];
                    if (this.isChangingLanes()) { // then we've finished changing lanes
                        this.setChangingLanes(false);
                        let nextSegId: number = +(`${currentSegment.id}`.split('.')[1]);
                        nextSegments = [this.map.getSegmentById(nextSegId)];
                        this.map.removeSegment(this.getSegmentId());
                    } else {
                        nextSegments = this.map.getSegmentsStartingAt(currentSegmentEnd);
                    }

                    if(nextSegments?.length) {
                        // move to segment (pick randomly)
                        // TODO: lookup values from vehicle's choosen path
                        var randIndex = Math.floor((Math.random() * nextSegments.length));
                        var nextSeg: RoadSegment = nextSegments[randIndex];
                        this.map.addVehicle(this, nextSeg, this.getLocation());
                    } else {
                        // end of Road reached... remove vehicle from Simulation
                        this.map.removeVehicle(this);
                        return;
                    }
                } else {
                    this.moveForwardBy(remaining);
                    remaining = 0;
                }
            }
        }
        
        if (this.isCrashed()) {
            // remove vehicle after appropriate time has passed
            if (this.#crashedAt + this.#crashCleanupTime <= this.map.simMgr.getTotalElapsed()) {
                // remove self from the Simulation
                this.map.removeVehicle(this);
                return;
            }
        }
    }

    #isStopping: boolean = false;
    #updateVelocityAt: number = 0;
    updateVelocity(elapsedMs: number): void {
        // speed up or slow down
        if (this.shouldDecelerate()) {
            if (!this.#isStopping) {
                if (this.#updateVelocityAt <= this.map.simMgr.getTotalElapsed()) {
                    this.#isStopping = true;
                    this.brake(elapsedMs);
                    this.#updateVelocityAt = this.map.simMgr.getTotalElapsed() + this.reactionTime;
                }
            } else {
                this.brake(elapsedMs);
            }
        } else {
            if (this.#isStopping) {
                if (this.#updateVelocityAt <= this.map.simMgr.getTotalElapsed()) {
                    this.#isStopping = false;
                    this.accelerate(elapsedMs);
                    this.#updateVelocityAt = this.map.simMgr.getTotalElapsed() + this.reactionTime;
                }
            } else {
                this.accelerate(elapsedMs);
            }
        }
        
    }

    /**
     * returns the speed along the Z axis (fowards / backwards)
     * @returns the speed in Metres per Second
     */
    getVelocity(): number {
        return this.#velocity;
    }

    setCrashed(vehicle: Vehicle): void {
        this.#crashedAt = this.map.simMgr.getTotalElapsed();
        const maxVelocityMps: number = Math.max(this.getVelocity(), vehicle.getVelocity());
        if (maxVelocityMps < Utils.convertKmphToMetresPerSec(15)) {
            this.#crashCleanupTime = Utils.getRandomBetween(
                SimulationConstants.Vehicles.CrashCleanupDelay.LowSpeed.min,
                SimulationConstants.Vehicles.CrashCleanupDelay.LowSpeed.max
            );
        } else if (Utils.convertKmphToMetresPerSec(15) <= maxVelocityMps && maxVelocityMps < Utils.convertKmphToMetresPerSec(50)) {
            this.#crashCleanupTime = Utils.getRandomBetween(
                SimulationConstants.Vehicles.CrashCleanupDelay.MediumSpeed.min,
                SimulationConstants.Vehicles.CrashCleanupDelay.MediumSpeed.max
            );
        } else if (Utils.convertKmphToMetresPerSec(50) <= maxVelocityMps) {
            this.#crashCleanupTime = Utils.getRandomBetween(
                SimulationConstants.Vehicles.CrashCleanupDelay.HighSpeed.min,
                SimulationConstants.Vehicles.CrashCleanupDelay.HighSpeed.max
            );
        }
        this.getMaterial().color.setHex(0xff0000); // red
    }

    isCrashed(): boolean {
        return this.#crashedAt != null;
    }

    setChangingLanes(isChanging: boolean): void {
        this.#isChangingLanes = isChanging;
        if (this.isChangingLanes()) {
            this.#changeLaneTime = this.map.simMgr.getTotalElapsed() + this.changeLaneDelay;
        }
    }

    isChangingLanes(): boolean {
        return this.#isChangingLanes;
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
        const velKph: number = Utils.convertMetresPerSecToKmph(this.getVelocity());
        const seg: RoadSegment = this.map.getSegmentById(this.getSegmentId());
        if (velKph < this.maxSpeed && velKph < seg?.speedLimit) {
            let elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
            this.#velocity += this.acceleration * elapsedSeconds;
            this.getMaterial()?.color.setHex(0x66ff66); // green
        }
    }

    brake(elapsedMs: number): void {
        var elapsedSeconds = Utils.convertMillisecondsToSeconds(elapsedMs);
        this.#velocity -= this.deceleration * elapsedSeconds;
        // prevent going backwards
        if (this.getVelocity() < 0) {
            this.#velocity = 0;
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
            var vehicles: Vehicle[] = this.map.getVehiclesWithinRadius(this, this.length * 2);
            vehicles.forEach((vehicle) => {
                if (Utils.isCollidingWith(this, vehicle)) {
                    this.map.simMgr.log(`crash of vehicle: ${this.id} at ${JSON.stringify(this.getLocation())} with vehicle: ${vehicle.id} at ${JSON.stringify(vehicle.getLocation())}`);
                    if (!this.isCrashed()) { this.setCrashed(vehicle); }
                    if (!vehicle.isCrashed()) { vehicle.setCrashed(this); }
                }
            });
        }

        // check again as we may have crashed
        if (this.isCrashed()) {
            return true;
        }
        
        // check for vehicles in range
        var foundV: ShouldStopResponse = this.map.shouldStopForVehicles(this);
        if (foundV && foundV.stop) {
            let lane: RoadSegment = this.shouldChangeLanes(foundV.id);
            if (lane) {
                let changeLaneSegment: RoadSegment = this.map.createChangeLaneSegment(this, lane);
                if (changeLaneSegment) {
                    this.setChangingLanes(true);
                    changeLaneSegment.addVehicle(this);
                    return false; // no deceleration needed because we're changing lanes
                }
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: ShouldStopResponse = this.map.shouldStopForTfcs(this);
        if (foundTfc && foundTfc.stop) {
            return foundTfc.stop;
        }

        // check for corners
        var foundCorner = this.map.shouldSlowForCorner(this);
        if (foundCorner && foundCorner.stop) { // and finally check for cornering in range
            return foundCorner.stop;
        }
    }

    shouldChangeLanes(obstructingVehicleId: number): RoadSegment {
        let newLane: RoadSegment;
        if (!this.isChangingLanes() && this.#changeLaneTime < this.map.simMgr.getTotalElapsed()) {
            let availableLanes: RoadSegment[] = this.map.getSimilarSegmentsInRoad(this.getSegmentId());
            let obstructingVehicle: Vehicle = this.map.getVehicleById(obstructingVehicleId);
            for (var i=0; i<availableLanes.length; i++) {
                let availableLane: RoadSegment = availableLanes[i];
                // ensure availableLane is clear ahead
                let vehicles: Vehicle[] = this.map
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
                    let nearby: Vehicle[] = this.map
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
        const segment: RoadSegment = this.map.getSegmentById(this.getSegmentId());
        if (segment) {
            var maxAngle = 45;
            if (segment?.isInlet) {
                maxAngle = 90;
            }
            let otherLoc: Vector3 = otherVehicle.getLocation();
            var headingLine = new Line3(this.getLocation(), segment?.getEnd());
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
        // var distanceToReact = Utils.convertMillisecondsToSeconds(this.reactionTime) * (vel / 2);
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