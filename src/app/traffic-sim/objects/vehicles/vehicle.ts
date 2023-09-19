import { Mesh, BoxGeometry, Vector3, Object3D, Line3, BufferGeometry, Line } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { Body, Box, Vec3, Quaternion as Quat4, Material } from "cannon-es";

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
    accelerationRate?: number;
    /**
     * deceleration in Metres per Second
     */
    maxDecelerationRate?: number;
    /**
     * minimum time in milliseconds to wait after changing lanes before changing again
     */
    changeLaneDelay?: number;
    /**
     * maximum speed this vehicle can sustain in Metres per Second
     */
    maxSpeed?: number;
    /**
     * the starting speed along the forward trajectory for this vehicle in Metres
     * per Second
     */
    startingSpeed?: number;
    /**
     * the starting `VehicleState` @default stopped
     */
    startingState?: VehicleState;
}

export type VehicleState = 'decelerating' | 'accelerating' | 'stopped' | 'changinglane';

export class Vehicle extends TrafficObject {
    /**
     * milliseconds taken to react to events (defaults to 2500 ms)
     */
    readonly reactionTime: number;
    /**
     * acceleration in Metres per Second (defaults to 2.78 mps)
     */
    readonly accelerationRate: number;
    /**
     * deceleration in Metres per Second (defaults to 6.94 mps)
     */
    readonly maxDecelerationRate: number;
    /**
     * amount of time after changing lanes before considering changing again in milliseconds (defaults to 5000 ms)
     */
    readonly changeLaneDelay: number;
    /**
     * maximum speed vehicle can go in Metres per Second (defaults to 72.2 or 250 Km/h)
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
    private _speed: number; // see: {get speed()}
    private _crashedAt: number; // see: {get crashedAt()}
    private _crashCleanupTime: number; // see: {get crashCleanupTime()}
    private _body: Body; // cannon-es physics body (only if `hasPhysics` is true)
    private _state: VehicleState;
    private _heading: Object3D;
    private _lastReaction: number; // see {get lastReactionTime()}

    private readonly _width: number;
    private readonly _length: number;
    private readonly _height: number;

    constructor(options?: VehicleOptions, simMgr?: SimulationManager) {
        super(options as TrafficObjectOptions, simMgr);
        this._width = options?.width ?? 2; // metres
        this._length = options?.length ?? 3; // metres
        this._height = options?.height ?? 1.5; // metres
        this.reactionTime = options?.reactionTime || 250; // milliseconds
        this.accelerationRate = options?.accelerationRate ?? 2.78; // Metres per Second
        this.maxDecelerationRate = options?.maxDecelerationRate ?? 6.94; // Metres per Second
        this.changeLaneDelay = options?.changeLaneDelay || 30000; // milliseconds
        this.maxSpeed = options?.maxSpeed ?? 72.2; // Metres per Second
        
        this._speed = options?.startingSpeed || 0; // Metres per Second
        this._changeLaneTime = this.changeLaneDelay;
        this._state = options?.startingState ?? 'stopped';
        this._lastReaction = 0;
    }

    /**
     * the last time the driver reacted to some event in milliseconds of simulation time
     */
    get lastReactionTime(): number {
        return this._lastReaction;
    }

    /**
     * the next time the driver should react to events in milliseconds of simulation time
     */
    get nextReactionTime(): number {
        return this.lastReactionTime + this.reactionTime;
    }

    get state(): VehicleState {
        return this._state;
    }

    override get body(): Body {
        if (this.hasPhysics) {
            if (!this._body) {
                const loc = this.mesh.position;
                const q = this.rotation;
                this._body = new Body({
                    mass: 100, // kg; TODO: get mass from obj props
                });
                this._body.addShape(new Box(new Vec3(this.width / 2, this.height / 2, this.length / 2)));
                this._body.position.set(loc.x, loc.y, loc.z);
                this._body.quaternion.set(q.x, q.y, q.z, q.w);
                this.simMgr.physicsManager.addBody(this._body);
            }
            return this._body;
        }
        return super.body;
    }

    /**
     * the speed along the Z axis, fowards or backwards (negative for backwards)
     * @returns the speed in Metres per Second
     */
    get speed(): number {
        if (this.hasPhysics) {
            const relativeVelocity = this.body.velocity
                .clone()
                .vsub(this.body.velocity
                .vsub(this.body.quaternion.vmult(new Vec3(0, 0, 1))))
                .z;
            return relativeVelocity * 100;
        }
        return this._speed;
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
            accelerationRate: this.accelerationRate,
            maxDecelerationRate: this.maxDecelerationRate,
            changeLaneDelay: this.changeLaneDelay,
            maxSpeed: this.maxSpeed,
            startingSpeed: this.speed
        });
        v.location = this.location;
        v.rotation = this.rotation;

        return v;
    }

    update(elapsedMs: number): void {
        if (isNaN(this.speed)) {
            debugger;
        }
        
        if (this.simMgr.debug) {
            this.viewHeadingLine();
        }

        if (!this.segment) {
            // end of Road reached... remove vehicle from Simulation
            this.simMgr.removeVehicle(this);
            return;
        }

        if (this.isCrashed()) {
            // remove vehicle after appropriate time has passed
            if (this.crashCleanupTime <= this.simMgr.totalElapsed) {
                console.info('cleaning up crashed vehicle', this.name);
                // remove self from the Simulation
                this.simMgr.removeVehicle(this);
                return;
            }
        }

        if (this.segment) {
            // if we've reached the end of our current `RoadSegment`
            if (Utils.isWithinRange(this.location, this.segment.end, this.length / 2)) {
                let nextSegments: Array<RoadSegment>;
                if (this.isChangingLanes) {
                    // get all segments we could enter (except the one we're already on)
                    nextSegments = this.simMgr.mapManager.getSegmentsContainingPoint(this.segment.end)
                        .filter(s => s.id != this.segmentId);
                    // then we've finished changing lanes
                    this._isChangingLanes = false;
                    this.simMgr.mapManager.removeSegment(this.segmentId);
                    console.info(this.name, 'finished lane change with', nextSegments, 'available');
                } else {
                    nextSegments = this.simMgr.mapManager.getSegmentsStartingAt(this.segment.end, this.segment.roadName);
                }
                // if there is a next Segment
                if(nextSegments?.length) {
                    // move to segment (pick randomly)
                    // TODO: lookup values from vehicle's choosen path
                    var randIndex = Utils.getRandomIntBetween(0, nextSegments.length);
                    var nextSeg: RoadSegment = nextSegments[randIndex];
                    nextSeg.addVehicle(this);
                } else {
                    // end of Road reached... remove vehicle from Simulation
                    this.simMgr.removeVehicle(this);
                    return;
                }
            }

            this.turnTowards(this.segment?.end, elapsedMs);
            
            const pos = this.body?.position ?? this.location;
            if (isNaN(pos?.x)) {
                // debugger;
                return;
            }
            const loc = this.location;
            const speed = this.speed;
            let acceleration: number;
            // if (this.nextReactionTime <= this.simMgr.totalElapsed) {
            //     this._lastReaction = this.simMgr.totalElapsed;
                this._state = this.simMgr.decisionEng.getDesiredState(this);
            // }
            switch(this.state) {
                case 'changinglane':
                    const lane = this.startLaneChange();
                    if (!lane) {
                        this._state = 'decelerating';
                        this.brake(elapsedMs);
                        break;
                    } else {
                        this._state = 'accelerating';
                    }
                case 'accelerating':
                    // set mesh position from physics body
                    acceleration = this.accelerate(elapsedMs);
                    acceleration *= 10;
                    break;
                case 'decelerating':
                    // set mesh position from physics body
                    acceleration = this.brake(elapsedMs);
                    acceleration *= 0.0001;
                    break;
                case 'stopped':
                    // set physics body position from mesh (prevent sliding while stopped)
                    this._speed = 0;
                    this.body?.velocity?.set(0, 0, 0);
                    acceleration = 0;
                    break;
            }
            if (this.hasPhysics) {
                if (acceleration !== 0) {
                    const relativeVelocity = this.body.velocity
                        .vsub(this.body.velocity
                        .vsub(this.body.quaternion.vmult(new Vec3(0, 0, 1))));
                    const frictionForce = relativeVelocity.scale(-1);
                    const localForce = new Vec3(0, 0, acceleration);
                    const accelerationForce = this.body.quaternion.vmult(localForce);
                    this.body.applyForce(
                        new Vec3(
                            accelerationForce.x - frictionForce.x, 
                            accelerationForce.y - frictionForce.y, 
                            accelerationForce.z - frictionForce.z
                        )
                    );
                }
            } else {
                const dist = speed * Utils.convertMillisecondsToSeconds(elapsedMs); // Metres
                this.moveForwardBy(dist);
            }

            switch(this.state) {
                case 'stopped':
                    // set physics body position from mesh (prevent sliding while stopped)
                    this.body?.position?.set(loc.x, loc.y, loc.z);
                    break;
                default:
                    // set mesh position from physics body
                    this.obj3D.position.set(pos.x, pos.y, pos.z);
                    break;
            }
        }
    }

    /**
     * turns this `Vehicle` to look at the point based on the maximum turn
     * rate allowed for the speed of this vehicle and the amount of time passed.
     * @param point the `Vector3` to turn towards
     * @param elapsedMs the amount of time elapsed since last called
     */
    turnTowards(point: Vector3, elapsedMs: number = 1): void {
        if (point) {
            const headingLine = Utils.getHeadingLine(this);
            const desiredHeadingLine = new Line3(this.location, point);
            const degreesDelta: number = Math.abs(Utils.angleFormedBy(headingLine, desiredHeadingLine));
            const maxTurnAngle: number = Utils.turnRateCalculator(this.speed) * (elapsedMs / 1000);
            if (maxTurnAngle > degreesDelta) {
                this.lookAt(point);
            } else {
                const percentTurned = maxTurnAngle / degreesDelta;
                const look = Utils.getPointInBetweenByPercent(this.location, point, percentTurned);
                this.lookAt(look);
            }
        }
    }

    isCrashed(): boolean {
        if (this._crashedAt != null) {
            return true;
        }
        const nearbyVehicles = this.simMgr.mapManager.getVehiclesWithinRadius(this, this.length * 2);
        if (nearbyVehicles.some(v => Utils.isCollidingWith(this.mesh, v.mesh))) {
            this._crashedAt = this.simMgr.totalElapsed;
            this.material.color.setHex(0xff0000); // red
            this._crashCleanupTime = this._crashedAt
                + Utils.getRandomRealBetween(
                    SimulationManager.Constants.CRASH_CLEANUP_MIN_DELAY, 
                    SimulationManager.Constants.CRASH_CLEANUP_MAX_DELAY);
            return true;
        }
        return false;
    }

    /**
     * if this vehicle is not exceeding its `maxSpeed` and the
     * `RoadSegment.speedLimit` the current speed will be increased
     * using the following formula:
     * `Vf = Vi + A * t`
     * 
     * where:
     * `Vf` is the final velocity in Metres per Second
     * `Vi` is the current velocity in Metres per Second
     * `A` is the `acceleration` in Metres per Second
     * `t` is the elapsed time in Seconds
     * @param elapsedMs amount of time, in milliseconds, elapsed since last update
     * @returns the acceleration applied
     */
    accelerate(elapsedMs: number): number {
        let acceleration: number = 0;
        if (this.speed < this.maxSpeed && this.speed < this.segment?.speedLimit) {
            const elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
            acceleration = this.accelerationRate * elapsedSeconds;
            if (!this.isCrashed()) {
                this.material?.color.setHex(0x66ff66); // green
            }
        }
        this._speed += acceleration;
        return acceleration;
    }

    /**
     * if this vehicle is not already stopped the current speed
     * will be decreased using the following formula:
     * `Vf = Vi + A * t`
     * 
     * where:
     * `Vf` is the final velocity in Metres per Second
     * `Vi` is the current velocity in Metres per Second
     * `A` is the `acceleration` in Metres per Second
     * `t` is the elapsed time in Seconds
     * @param elapsedMs amount of time, in milliseconds, elapsed since last update
     * @returns the deceleration applied (negative value)
     */
    brake(elapsedMs: number): number {
        // TODO: determine amount of deceleration required up to max allowed
        let acceleration: number = 0;
        if (this.speed > 0) {
            const elapsedSeconds = Utils.convertMillisecondsToSeconds(elapsedMs);
            acceleration = 1 * elapsedSeconds; // this.maxDecelerationRate * elapsedSeconds;
            if (!this.isCrashed()) {
                this.material?.color.setHex(0xffff00); // yellow
            }
        }
        this._speed -= acceleration;
        return 0; //-acceleration;
    }

    canChangeLanes(): boolean {
        return !this.isChangingLanes
            && this._changeLaneTime <= this.simMgr.totalElapsed;
    }

    startLaneChange(): RoadSegment {
        let newLane: RoadSegment;
        const aPoint = new Vector3();
        const bPoint = new Vector3();
        const line = new Line3();
        const loc = this.location;
        const availableLanes: RoadSegment[] = this.simMgr.mapManager.getParallelSegmentsInRoad(this.segment)
            .sort((a, b) => {
                a.line.closestPointToPoint(loc, true, aPoint);
                b.line.closestPointToPoint(loc, true, bPoint);
                const aDist = line.set(loc, aPoint).distance();
                const bDist = line.set(loc, bPoint).distance();
                if (aDist < bDist) {
                    return -1;
                } else if (aDist > bDist) {
                    return 1;
                } else {
                    return 0;
                }
            });
        if (availableLanes.length > 0) {
            const availableLane: RoadSegment = availableLanes[0];
            // ensure availableLane is clear ahead
            const vehicles: Vehicle[] = this.simMgr.mapManager
                .getVehiclesWithinRadius(this, this.getLookAheadDistance())
                .filter(v => v.segmentId === availableLane.id);
            if (vehicles.every(v => v.speed >= this.speed)) {
                newLane = availableLane;
            }
        }
        if (newLane) {
            const changeLaneSegment: RoadSegment = this.simMgr.mapManager.createChangeLaneSegment(this.location, newLane);
            if (changeLaneSegment) {
                console.info(this.name, 'changing lane from ', this.segment.name, 'to', changeLaneSegment.name);
                this._isChangingLanes = true;
                this._changeLaneTime = this.simMgr.totalElapsed + this.changeLaneDelay;
                changeLaneSegment.addVehicle(this);
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
     * TODO: when on inlet segment use cross product to look left / right
     * @param obj the `TrafficObject` to check if is in view
     * @returns `true` if the passed in `obj` can be "seen", otherwise `false`
     */
    hasInViewAhead(obj: TrafficObject): boolean {
        // const view = this.getLookAheadCollisionBox();
        // return view.containsBox(obj.boundingBox);
        const headingLine = Utils.getHeadingLine(this);
        const headingToLocation = new Line3(this.location, obj.location);
        const angle = Utils.angleAxisFormedBy(headingLine, headingToLocation, 'y');
        if (angle >= -45 && angle <= 45) {
            // TODO: limit view to above road only (no viewing below vehicle hood for ex.)
            return true;
        }
        return false;
    }

    hasInViewLeft(obj: TrafficObject): boolean {
        const headingLine = Utils.getHeadingLine(this);
        const headingToLocation = new Line3(this.location, obj.location);
        const angle = Utils.angleAxisFormedBy(headingLine, headingToLocation, 'y');
        if (angle <= -45 && angle >= -135) {
            return true;
        }
        return false;
    }

    hasInViewRight(obj: TrafficObject): boolean {
        const headingLine = Utils.getHeadingLine(this);
        const headingToLocation = new Line3(this.location, obj.location);
        const angle = Utils.angleAxisFormedBy(headingLine, headingToLocation, 'y');
        if (angle >= 45 && angle <= 135) {
            return true;
        }
        return false;
    }

    hasInViewBehind(obj: TrafficObject): boolean {
        // const view = this.getLookAheadCollisionBox();
        // return view.containsBox(obj.boundingBox);
        const headingLine = Utils.getHeadingLine(this);
        const headingToLocation = new Line3(this.location, obj.location);
        const angle = Utils.angleAxisFormedBy(headingLine, headingToLocation, 'y');
        if ((angle <= -135 && angle >= -225) || (angle >= 135 && angle <= 225)) {
            // TODO: limit view to above road only (no viewing below vehicle hood for ex.)
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
     * `Vf` = desired velocity (0 Metres per Second)
     * `Vi` = current velocity (Metres per Second)
     * `d` = distance (Metres)
     * `t` = time (Seconds)
     * @returns the distance required to safely stop in metres
     */
    getLookAheadDistance(): number {
        const safeDecelerationRate = 1; // m/s^2
        const time: number = this.speed / safeDecelerationRate; // Seconds
        const distanceToStop: number = this.speed * (time * Utils.convertMillisecondsToSeconds(this.reactionTime)); // metres
        const total: number = distanceToStop + (this.length * 3);
        return total;
    }

    /**
     * displays a line to show the heading of this vehicle if it is moving.
     * 
     * NOTE: this line is independent of the actual vehicle and will not move
     * with it. each call destroys the old line and creates a new line at the
     * vehicle position pointing in the direction of travel
     */
    viewHeadingLine(): void {
        if (this.speed > 0) {
            if (this._heading) {
                this._destroyHeadingLine();
            }
            const line = Utils.getHeadingLine(this);
            const geom = new BufferGeometry().setFromPoints([line.start, line.end]);
            this._heading = new Line(geom);
            this.simMgr.viewManager.scene.add(this._heading);
        }
    }

    private _destroyHeadingLine(): void {
        this.simMgr.viewManager.scene.remove(this._heading);
        (this._heading as Mesh)?.geometry?.dispose();
        this._heading = null;
    }

    protected generateObj3D(): Object3D {
        const vehicleGeometry = new BoxGeometry(this._width, this._height, this._length);
        const mesh = new Mesh(vehicleGeometry, this.material);
        mesh.translateY(this._height / 2);
        
        return mesh;
    }

    override disposeGeometry(): void {
        super.disposeGeometry();
        this._destroyHeadingLine();
        if (this.body) {
            this.simMgr.physicsManager.removeBody(this.body);
        }
    }
}