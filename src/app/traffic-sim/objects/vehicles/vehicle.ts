import { Mesh, BoxGeometry, Vector3, Object3D, Line3, BufferGeometry, Line, Quaternion } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { Body, Box, Vec3, Quaternion as Quat4 } from "cannon-es";

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
    static mass: number = 100;
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
                    mass: Vehicle.mass, // kg; TODO: get mass from obj props
                });
                const dimensions = new Vec3(this.width / 2, this.height / 2, this.length / 2);
                // console.info({dimensions});
                this._body.addShape(new Box(dimensions));
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
     * @returns the speed in Metres per Second along the vehicle's Z axis
     */
    get speed(): number {
        const q = this.rotation.invert();
        const localVelocity = this.velocity.applyQuaternion(q);
        return localVelocity.z;
    }

    /**
     * `true` if vehicle is changing lanes
     */
    get changingLanes(): boolean {
        return this._isChangingLanes ?? false;
    }

    /**
     * sets the current state of lane changing
     */
    set changingLanes(changing: boolean) {
        this._isChangingLanes = changing ?? false;
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

    override update(elapsedMs: number): void {
        super.update(elapsedMs);

        if (this.simMgr.debug) {
            this.viewHeadingLine();
        }

        if (!this.segment) {
            // end of Road reached... remove vehicle from Simulation
            this.simMgr.removeVehicle(this);
            console.warn('vehicle', this.name, 'has no segment so was removed from the map');
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
                const nextSegment = this.simMgr.mapManager.getNextSegment(this);
                if (nextSegment) {
                    nextSegment.addVehicle(this);
                    console.info('vehicle', this.name, 'moved to new segment', nextSegment.name, 'in road', nextSegment.roadName);
                } else {
                    this.simMgr.removeVehicle(this);
                    console.warn('vehicle', this.name, 'has no segment so was removed from the map');
                    return;
                }
            }

            this.turnTowards(this.segment?.end, elapsedMs);
            let state = this.state;
            if (this.nextReactionTime >= this.simMgr.totalElapsed) {
                this._lastReaction = this.simMgr.totalElapsed;
                state = this.simMgr.decisionEng.getDesiredState(this);
            }
            const acceleration = this.getDesiredAccelerationForDesiredState(state);
            this.setVehicleColourForState(this.state);
            if (this.hasPhysics) {
                const force = Vehicle.mass * acceleration;
                const percent = elapsedMs / 1000;
                this.applyForce(force * percent);
            } else {
                const dist = this.speed * Utils.convertMillisecondsToSeconds(elapsedMs); // Metres
                this.moveForwardBy(dist);
            }

            switch(this.state) {
                case 'stopped':
                    const loc = this.location;
                    // set physics body position from mesh (prevent sliding while stopped)
                    this.body?.velocity?.set(0, 0, 0);
                    this.body?.position?.set(loc.x, loc.y, loc.z);
                    break;
                default:
                    const pos = this.body?.position ?? this.location;
                    if (isNaN(pos?.x)) {
                        // debugger;
                        return;
                    }
                    // set mesh position from physics body
                    this.obj3D.position.set(pos.x, pos.y, pos.z);
                    break;
            }
        }
    }

    /**
     * sets the vehicle's colour based on it's crashed or acceleration
     * states
     * @param state the `VehicleState` to base the colour on
     */
    setVehicleColourForState(state: VehicleState): void {
        if (this.isCrashed()) {
            this.material.color.setHex(0xff0000); // red
            return;
        }
        switch(state) {
            case 'accelerating':
                this.material?.color.setHex(0x66ff66); // green
                break;
            case 'decelerating':
                this.material?.color.setHex(0xffff00); // yellow
                break;
            case 'stopped':
                this.material?.color.setHex(0xc0c0c0);
                break;
            default:
                break;
        }
    }

    /**
     * calculates the acceleration to be applied based on the passed in
     * `VehicleState`
     * @param state the `VehicleState` used to determine acceleration
     * @returns the acceleration to apply
     */
    getDesiredAccelerationForDesiredState(state: VehicleState): number {
        let acceleration: number = 0;
        switch(state) {
            case 'changinglane':
                console.debug('vehicle', this.name, 'wants to change lanes')
                const lane = this.startLaneChange();
                if (!lane) {
                    this._state = 'decelerating';
                    acceleration = -1; // m/s
                } else {
                    this._state = 'accelerating';
                    acceleration = this.accelerationRate;
                }
                break;
            case 'accelerating':
                console.debug('vehicle', this.name, 'wants to accelerate');
                acceleration = this.accelerationRate; // m/s
                break;
            case 'decelerating':
                console.debug('vehicle', this.name, 'wants to decelerate');
                acceleration = -1; // m/s
                break;
            case 'stopped':
                console.debug('vehicle', this.name, 'wants to stop');
                break;
            default:
                break;
        }
        return acceleration;
    }

    /**
     * applies the passed in force to the `body` object along
     * the z axis subtracting any friction forces along other axis
     * @param force the force to apply along the z axis
     */
    applyForce(force: number): void {
        if (force !== 0) {
            const deltaV = Utils.getHeading(this, {x:0, y:0, z:1})
                .multiplyScalar(force);
            console.info({accelerationForce: deltaV});
            this.body.applyForce(
                new Vec3(
                    deltaV.x, 
                    deltaV.y, 
                    deltaV.z
                )
            );
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
        const p1 = this.obj3D.position;
        const r1 = this.length;
        const nearbyVehicles = this.simMgr.mapManager.getVehiclesWithinRadius(this, this.length * 2);
        if (nearbyVehicles.some(v => Utils.isCollidingWith(p1, r1, v.obj3D.position, v.length))) {
            this._crashedAt = this.simMgr.totalElapsed;
            this._crashCleanupTime = this._crashedAt
                + Utils.getRandomRealBetween(
                    SimulationManager.Constants.CRASH_CLEANUP_MIN_DELAY, 
                    SimulationManager.Constants.CRASH_CLEANUP_MAX_DELAY);
            return true;
        }
        return false;
    }

    canChangeLanes(): boolean {
        return !this.changingLanes
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
        const distanceToStop: number = this.speed * this.safeStopTime(); // metres
        const total: number = distanceToStop + (this.length * 2);
        console.info({distanceToStop}, `${this.length}`, {total});
        return total;
    }

    /**
     * calculates the amount of time required to stop this vehicle safely
     * @returns the amount of time, in seconds, required to stop safely
     */
    safeStopTime(): number {
        const speed = this.speed;
        const reactionSeconds = Utils.convertMillisecondsToSeconds(this.reactionTime);
        if (Utils.fuzzyEquals(speed, 0.01)) {
            console.info({speed}, {reactionSeconds});
            return reactionSeconds;
        }
        const safeDecelerationRate = 1; // m/s^2
        const time: number = (speed / safeDecelerationRate) + reactionSeconds;
        console.info({speed}, {reactionSeconds}, {safeDecelerationRate}, {time});
        return time; // seconds
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