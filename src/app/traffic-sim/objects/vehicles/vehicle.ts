import { Mesh, BoxGeometry, Line3, Vector3, Object3D, Box3, Quaternion, ConeGeometry, Group, MathUtils, Material, MeshBasicMaterial, CylinderGeometry } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { TrafficFlowControl } from "../traffic-controls/traffic-flow-control";

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
    private _velocity: number; // see: {get velocity()}
    private _crashedAt: number; // see: {get crashedAt()}
    private _crashCleanupTime: number; // see: {get crashCleanupTime()}
    private _vehicleMesh: Mesh;
    private _driverViewMesh: Mesh;
    private _viewMaterial: Material;

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
        this._viewMaterial = new MeshBasicMaterial({
            color: 0xc6c6c6, // gray
            wireframe: true
        });
    }

    /**
     * the speed along the Z axis, fowards or backwards (negative for backwards)
     * @returns the speed in Metres per Second
     */
    get velocity(): number {
        return this._velocity;
    }

    /**
     * `true` if vehicle is changing lanes
     */
    get isChangingLanes(): boolean {
        return this._isChangingLanes ?? false;
    }

    /**
     * time when (if) a crash occurred
     */
    get crashedAt(): number {
        return this._crashedAt;
    }

    /**
     * actual time when vehicle should be removed from simulation following crash. 
     * `crashedAt + randomBetween(MIN_CLEANUP, MAX_CLEANUP)`
     */
    get crashCleanupTime(): number {
        return this._crashCleanupTime;
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
            startingVelocity: this.velocity
        });
        v.location = this.location;
        v.rotation = this.rotation;

        return v;
    }

    update(elapsedMs: number): void {
        // console.info(`velocity: ${this.velocity}`);
        this.updateVelocity(elapsedMs);
        let distTravelled: number = Utils.getDistanceTravelled(this.velocity, elapsedMs);
        // check if we should move to next RoadSegment or remove vehicle from the simulation
        if (distTravelled > 0) {
            if (this.segmentId) {
                /**
                 * NOTE: skipping ahead like this means that at high enough speeds we can pass through
                 * stationary objects without collision detection being alerted. TODO: fix using line
                 * projections in the future
                 */
                while (distTravelled >= Utils.getLength(this.location, this.segment.end)) {
                    distTravelled -= Utils.getLength(this.location, this.segment.end);
                    const nextSegments = this.simMgr.mapManager.getSegmentsStartingAt(this.segment.end);
                    // if there is a next Segment
                    if(nextSegments?.length) {
                        // move to segment (pick randomly)
                        // TODO: lookup values from vehicle's choosen path
                        var randIndex = Utils.getRandomIntBetween(0, nextSegments.length);
                        var nextSeg: RoadSegment = nextSegments[randIndex];
                        nextSeg.addVehicle(this, this.segment.end);
                    }
                    if (this.isChangingLanes) { // then we've finished changing lanes
                        this._isChangingLanes = false;
                        this.simMgr.mapManager.removeSegment(this.segmentId);
                    }
                    if (!nextSegments?.length) {
                        // end of Road reached... remove vehicle from Simulation
                        this.simMgr.removeVehicle(this);
                        return;
                    }
                }
            }
        }
        
        if (this.isCrashed()) {
            // remove vehicle after appropriate time has passed
            if (this.crashCleanupTime <= this.simMgr.totalElapsed) {
                // remove self from the Simulation
                this.simMgr.removeVehicle(this);
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
     * if not already set, sets the `_crashedAt` and `_crashCleanupTime` properties,
     * otherwise does nothing
     */
    setCrashed(): void {
        if (this.isCrashed()) {
            return;
        }

        this._crashedAt = this.simMgr.totalElapsed;
        this.material.color.setHex(0xff0000); // red
        this._crashCleanupTime = this._crashedAt
            + Utils.getRandomRealBetween(
                SimulationManager.Constants.CRASH_CLEANUP_MIN_DELAY, 
                SimulationManager.Constants.CRASH_CLEANUP_MAX_DELAY);
    }

    isCrashed(): boolean {
        return this._crashedAt != null;
    }

    setChangingLanes(): void {
        this._isChangingLanes = true;
        this._changeLaneTime = this.simMgr.totalElapsed + this.changeLaneDelay;
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
        let velKph: number = Utils.convertMetresPerSecToKmph(this.velocity);
        if (velKph < this.maxSpeed && velKph < this.segment?.speedLimit) {
            let elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
            this._velocity += this.acceleration * elapsedSeconds;
            this.material?.color.setHex(0x66ff66); // green
        }
    }

    brake(elapsedMs: number): void {
        var elapsedSeconds = Utils.convertMillisecondsToSeconds(elapsedMs);
        this._velocity -= this.deceleration * elapsedSeconds;
        // prevent going backwards
        if (this.velocity < 0) {
            this._velocity = 0;
        }
        if (this.isCrashed()) {
            this.material?.color.setHex(0xff0000); // red
        } else {
            this.material?.color.setHex(0xffff00); // yellow
        }
    }

    shouldDecelerate(skipCollisionCheck: boolean = false): boolean {
        if (this.isCrashed()) {
            return true;
        }
        
        if (!skipCollisionCheck) {
            // perform collision check
            var vehicles: Vehicle[] = this.simMgr.mapManager.getVehiclesWithinRadius(this, this.length * 2);
            vehicles.forEach((vehicle) => {
                if (Utils.isCollidingWith(this, vehicle)) {
                    console.warn(`crash of vehicle: ${this.id} at ${JSON.stringify(this.location)} with vehicle: ${vehicle.id} at ${JSON.stringify(vehicle.location)}`);
                    this.setCrashed();
                    vehicle.setCrashed();
                }
            });
        }

        // check again as we may have crashed
        if (this.isCrashed()) {
            return true;
        }
        
        // check for vehicles in range
        var foundV: Vehicle = this.simMgr.mapManager.shouldStopForVehicles(this);
        if (foundV) {
            let lane: RoadSegment = this.shouldChangeLanes(foundV);
            if (lane) {
                let changeLaneSegment: RoadSegment = this.simMgr.mapManager.createChangeLaneSegment(this.location, lane);
                if (changeLaneSegment) {
                    this.setChangingLanes();
                    changeLaneSegment.addVehicle(this);
                    return false; // no deceleration needed because we're changing lanes
                }
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: TrafficFlowControl = this.simMgr.mapManager.shouldStopForTfcs(this);
        if (foundTfc) {
            // console.debug(`vehicle ${this.id} should stop for tfc ${foundTfc.id}`);
            return true;
        }

        // check for corners
        var foundCorner = this.simMgr.mapManager.shouldSlowForCorner(this);
        if (foundCorner != null) {
            return true;
        }
    }

    shouldChangeLanes(obstructingVehicle: Vehicle): RoadSegment {
        let newLane: RoadSegment;
        if (! this.isChangingLanes && this._changeLaneTime < this.simMgr.totalElapsed) {
            let availableLanes: RoadSegment[] = this.simMgr.mapManager.getSimilarSegmentsInRoad(this.segment);
            for (var i=0; i<availableLanes.length; i++) {
                let availableLane: RoadSegment = availableLanes[i];
                // ensure availableLane is clear ahead
                let vehicles: Vehicle[] = this.simMgr.mapManager
                    .getVehiclesWithinRadiusAhead(this.location, availableLane, this.getLookAheadDistance()).filter((veh) => {
                        return this.id != veh.id;
                    });
                if (vehicles.length > 0) {
                    for (var j=0; j<vehicles.length; j++) {
                        let veh: Vehicle = vehicles[j];
                        if (veh.velocity > obstructingVehicle.velocity) {
                            newLane = availableLane;
                            break;
                        }
                    }
                } else {
                    newLane = availableLane;
                }
                if (newLane) {
                    // ensure no vehicles nearby in lane
                    let nearby: Vehicle[] = this.simMgr.mapManager
                        .getVehiclesWithinRadius(this, this.getLookAheadDistance() * 2)
                        .filter((veh) => {
                            return veh.segmentId != this.segmentId;
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

    /**
     * gets the current heading and compares it against the heading to the centre
     * of the supplied `obj` and if it is less than 45 degrees (90 degrees for inlet
     * roads) returns `true`, otherwise `false`
     * 
     * TODO: include speed-based narrowing of vision
     * TODO: use `hasInViewLeft` and `hasInViewRight` when on inlet instead
     * @param obj the `TrafficObject` to check if is in view
     * @returns `true` if the passed in `obj` can be "seen", otherwise `false`
     */
    hasInViewAhead(obj: TrafficObject): boolean {
        const view = this.getLookAheadCollisionBox();
        return view.containsBox(obj.boundingBox);
        // if (this.segment) {
        //     var maxAngle = 45;
        //     if (this.segment?.isInlet) {
        //         maxAngle = 90;
        //     }
        //     let otherLoc: Vector3 = obj.location;
        //     var headingLine = new Line3(this.location, this.segment?.end);
        //     var headingToLocation = new Line3(this.location, otherLoc);

        //     if (Math.abs(Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
        //         return true;
        //     }
        // }
        // return false;
    }

    hasInViewLeft(obj: TrafficObject): boolean {
        // TODO: implement
        throw '[hasInViewLeft] needs to be implemented';
    }

    hasInViewRight(obj: TrafficObject): boolean {
        // TODO: implement
        throw '[hasInViewRight] needs to be implemented';
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
        var vel = this.velocity; // Metres per Second
        let time: number = vel / this.deceleration; // Seconds
        let distanceToStop: number = (vel / 2) * time; // metres
        // var distanceToReact = Utils.convertMillisecondsToSeconds(this.reactionTime) * (vel / 2);
        let total: number = distanceToStop + (this.length * 2);
        return total;
    }

    /**
     * a somewhat expensive call that creates a new `Box3` which
     * can be used to perform collision detection checks with
     * other vehicle's look-ahead collision boxes to determine if
     * the vehicles are on a collision course. use sparingly
     * @returns a `Box3` starting from the centre of this vehicle to the
     * look-ahead distance
     */
    getLookAheadCollisionBox(): Box3 {
        // const dist: number = this.getLookAheadDistance();
        // const mesh = new Mesh(new BoxGeometry(this.width, this.height, dist));
        // const pos = this.location;
        // const rot = this.rotation;
        // mesh.position.set(pos.x, pos.y, pos.z);
        // mesh.rotation.setFromQuaternion(rot);
        // mesh.translateZ(dist / 2);
        // const box = new Box3().setFromObject(mesh);
        // mesh.geometry.dispose();
        // return box;
        return new Box3().setFromObject(this._driverViewMesh, true);
    }

    protected generateObj3D(): Object3D {
        const group = new Group();
        
        // create vehicle mesh
        const vehicleGeometry = new BoxGeometry(this.width, this.height, this.length);
        this._vehicleMesh = new Mesh(vehicleGeometry, this.material);
        this._vehicleMesh.translateY(this.height / 2);
        
        // create driver view mesh
        const viewGeometry = new CylinderGeometry(this.width / 2, this.width * 2, this.length * 4, 6);
        this._driverViewMesh = new Mesh(viewGeometry, this._viewMaterial);
        this._driverViewMesh.visible = false;
        this._driverViewMesh.translateY(this.height / 2);
        this._driverViewMesh.translateY(-(this.length * 2));
        Utils.rotateAround(this._driverViewMesh, new Vector3(0, (this.height / 2), 0), new Vector3(1, 0, 0).normalize(), MathUtils.DEG2RAD * -90);
        
        group.add(this._vehicleMesh);
        group.add(this._driverViewMesh);
        return group;
    }

    override get mesh(): Mesh {
        return this._vehicleMesh;
    }

    override disposeGeometry(): void {
        super.disposeGeometry();
    }
}