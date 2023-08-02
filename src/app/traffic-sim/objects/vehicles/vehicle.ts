import { Mesh, BoxGeometry, Vector3, Object3D, Box3, Group, MathUtils, Material, MeshBasicMaterial, CylinderGeometry, Line3, BufferGeometry, Line } from "three";
import { Utils } from "../../helpers/utils";
import { RoadSegment } from "../../map/road-segment";
import { SimulationManager } from "../../simulation-manager";
import { TrafficObject, TrafficObjectOptions } from "../traffic-object";
import { Body, Box, Vec3, Quaternion as Quat4, Sphere } from "cannon-es";
import { VehicleDecisionEngine } from "./vehicle-decision-engine";

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
    /**
     * the starting `VehicleState` @default stopped
     */
    startingState?: VehicleState;
}

export type VehicleState = 'decelerating' | 'accelerating' | 'stopped' | 'changinglane';

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

    readonly decisionEng: VehicleDecisionEngine;

    /**
     * indicates if the vehicle is in the process of changing lanes
     */
    private _isChangingLanes: boolean;
    /**
     * time when we should consider changing lanes again if blocked
     */
    private _changeLaneTime: number;
    private _speed: number; // see: {get velocity()}
    private _crashedAt: number; // see: {get crashedAt()}
    private _crashCleanupTime: number; // see: {get crashCleanupTime()}
    private _vehicleMesh: Mesh;
    private _driverViewMesh: Mesh;
    private _viewMaterial: Material;
    private _body: Body;
    private _state: VehicleState;
    private _heading: Object3D;

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
        
        this._speed = options?.startingVelocity || 0; // Metres per Second
        this._changeLaneTime = this.changeLaneDelay;
        this._viewMaterial = new MeshBasicMaterial({
            color: 0xc6c6c6, // gray
            wireframe: true
        });
        this._state = options?.startingState ?? 'stopped';
        this.decisionEng = new VehicleDecisionEngine(this);
    }

    get state(): VehicleState {
        return this._state;
    }

    get driverView(): Mesh {
        return this._driverViewMesh;
    }

    override get body(): Body {
        if (this.hasPhysics) {
            if (!this._body) {
                const loc = this.location;
                this._body = new Body({
                    mass: 100, // kg; TODO: get mass from obj props
                    shape: new Sphere(this.height / 2),
                    position: new Vec3(loc.x, loc.y, loc.z), // m
                });
                this.simMgr.physicsManager.addBody(this.body);
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
            return this.body?.velocity?.length();
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
            acceleration: this.acceleration,
            deceleration: this.deceleration,
            changeLaneDelay: this.changeLaneDelay,
            maxSpeed: this.maxSpeed,
            startingVelocity: this.speed
        });
        v.location = this.location;
        v.rotation = this.rotation;

        return v;
    }

    update(elapsedMs: number): void {
        if (this.speed > 0) {
            if (this._heading) {
                this.simMgr.viewManager.scene.remove(this._heading);
                (this._heading as Mesh)?.geometry?.dispose();
                this._heading = null;
            }
            const line = Utils.getHeadingLine(this);
            const geom = new BufferGeometry().setFromPoints([line.start, line.end]);
            this._heading = new Line(geom);
            this.simMgr.viewManager.scene.add(this._heading);
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
                // get all segments we could enter (except the one we're already on)
                const nextSegments = this.simMgr.mapManager.getSegmentsContainingPoint(this.segment.end)
                    .filter(s => s.id != this.segmentId);
                // if there is a next Segment
                if(nextSegments?.length) {
                    // move to segment (pick randomly)
                    // TODO: lookup values from vehicle's choosen path
                    var randIndex = Utils.getRandomIntBetween(0, nextSegments.length);
                    var nextSeg: RoadSegment = nextSegments[randIndex];
                    nextSeg.addVehicle(this);
                }
                if (this.isChangingLanes) {
                    // then we've finished changing lanes
                    this._isChangingLanes = false;
                    this.simMgr.mapManager.removeSegment(this.segmentId);
                }
                if (!nextSegments.length) {
                    // end of Road reached... remove vehicle from Simulation
                    this.simMgr.removeVehicle(this);
                    return;
                }
            }

            this.turnTowards(this.segment.end, elapsedMs);
            
            const pos = this.body?.position;
            if (isNaN(pos?.x)) {
                // debugger;
                return;
            }
            const loc = this.location;
            let force: number = 0;
            this._state = this.decisionEng.getDesiredState();
            switch(this.state) {
                case 'changinglane':
                    console.info(this.name, 'changing lane');
                    this.startLaneChange();
                case 'accelerating':
                    // set mesh position from physics body
                    this.obj3D.position.set(pos.x, pos.y, pos.z);
                    this.accelerate(elapsedMs);
                    force = 0.01;
                    break;
                case 'decelerating':
                    // set mesh position from physics body
                    this.obj3D.position.set(pos.x, pos.y, pos.z);
                    this.brake(elapsedMs);
                    force = -0.0025;
                    break;
                case 'stopped':
                    // set physics body position from mesh (prevent sliding while stopped)
                    this.body.position.set(loc.x, loc.y, loc.z);
                    this._speed = 0;
                    this.body.velocity.set(0, 0, 0);
                    break;
            }
            if (force !== 0) {
                const deltaV = Utils.getHeading(this).multiply(new Vector3(force, force, force));
                this.body.applyForce(new Vec3(deltaV.x, deltaV.y, deltaV.z));
                const foo = this.body.force;
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
    accelerate(elapsedMs: number): number {
        const velKph: number = Utils.convertMetresPerSecToKmph(this.speed);
        let acceleration: number = 0;
        if (velKph < this.maxSpeed && velKph < this.segment?.speedLimit) {
            const elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
            acceleration = this.acceleration * elapsedSeconds;
            this.material?.color.setHex(0x66ff66); // green
        }
        this._speed += acceleration;
        return acceleration;
    }

    brake(elapsedMs: number): number {
        const velKph: number = Utils.convertMetresPerSecToKmph(this.speed);
        let acceleration: number = 0;
        if (velKph > 0) {
            const elapsedSeconds = Utils.convertMillisecondsToSeconds(elapsedMs);
            acceleration = this.deceleration * elapsedSeconds;
            this.material?.color.setHex(0xffff00); // yellow
        }
        this._speed -= acceleration;
        return -acceleration;
    }

    canChangeLanes(): boolean {
        return !this.isChangingLanes
            && this._changeLaneTime < this.simMgr.totalElapsed
            && this.simMgr.mapManager.getSimilarSegmentsInRoad(this.segment)?.length > 0;
    }

    startLaneChange(): RoadSegment {
        let newLane: RoadSegment;
        let availableLanes: RoadSegment[] = this.simMgr.mapManager.getSimilarSegmentsInRoad(this.segment);
        for (var i=0; i<availableLanes.length; i++) {
            let availableLane: RoadSegment = availableLanes[i];
            // ensure availableLane is clear ahead
            let vehicles: Vehicle[] = this.simMgr.mapManager
                .getVehiclesWithinRadius(this, this.getLookAheadDistance())
                .filter(v => v.segmentId === availableLane.id);
            if (vehicles.length > 0) {
                for (var j=0; j<vehicles.length; j++) {
                    let veh: Vehicle = vehicles[j];
                    if (veh.speed >= this.speed) {
                        newLane = availableLane;
                        break;
                    }
                }
            } else {
                newLane = availableLane;
            }
        }
        if (newLane) {
            const changeLaneSegment: RoadSegment = this.simMgr.mapManager.createChangeLaneSegment(this.location, newLane);
            if (changeLaneSegment) {
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
     * TODO: use `hasInViewLeft` and `hasInViewRight` when on inlet instead
     * TODO: limit view to above road only (no viewing below vehicle hood for ex.)
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
        var vel = this.speed; // Metres per Second
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
        this.simMgr.physicsManager.removeBody(this.body);
    }
}