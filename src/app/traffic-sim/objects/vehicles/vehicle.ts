import * as Phaser from "phaser";
import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";
import { Utils } from "../../helpers/utils";
import { Controllable } from "../../interfaces/controllable";
import { V2 } from "../../interfaces/custom-types";
import { Lane } from "../../map/lane";
import { LaneSegment } from "../../map/lane-segment";
import { Road } from "../../map/road";
import { RoadMap } from "../../map/road-map";
import { TrafficFlowControl } from "../traffic-controls/traffic-flow-control";
import { PositionableSimObj, PositionableSimObjOptions } from "../positionable-sim-obj";
import { Physics } from "../../interfaces/physics";

export type VehicleState = 'accelerating' | 'decelerating' | 'stopped' | 'coasting';

export type VehicleOptions = PositionableSimObjOptions & {
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
    startingVelocity?: Phaser.Types.Math.Vector2Like;
}

export class Vehicle extends PositionableSimObj<Phaser.GameObjects.Rectangle> implements Controllable, Physics {
    /**
     * milliseconds taken to react to events (defaults to 750 ms)
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
     * maximum velocity vehicle can go in Kilometres per Hour (defaults to 260)
     */
    readonly maxSpeed: number;

    /** Current `LaneSegment` */
    #laneSegment: LaneSegment;
    /**
     * indicates if the vehicle is in the process of changing lanes
     */
    #isChangingLanes: boolean;
    /**
     * time when we should consider changing lanes again if blocked
     */
    #changeLaneTime: number;
    /**
     * time when (if) a crash occurred
     */
    #crashedAt: number;
    /**
     * time when vehicle should be removed from simulation following crash
     */
    #crashCleanupTime: number;
    /**
     * indication of whether the vehicle is accelerating, decelerating,
     * stopped or coasting
     */
    #state: VehicleState;

    private _gameObj: Phaser.GameObjects.Rectangle;

    constructor(options: VehicleOptions) {
        super(options);

        this.reactionTime = options?.reactionTime || Utils.getRandomFloat(
            TrafficSimConstants.Vehicles.ReactionTime.min,
            TrafficSimConstants.Vehicles.ReactionTime.max
        ); // milliseconds
        this.acceleration = options?.acceleration || Utils.getRandomFloat(
            TrafficSimConstants.Vehicles.Acceleration.min,
            TrafficSimConstants.Vehicles.Acceleration.max
        ); // Metres per Second
        this.deceleration = options?.deceleration || Utils.getRandomFloat(
            TrafficSimConstants.Vehicles.Deceleration.min,
            TrafficSimConstants.Vehicles.Deceleration.max
        ); // Metres per Second
        this.changeLaneDelay = options?.changeLaneDelay || Utils.getRandomFloat(
            TrafficSimConstants.Vehicles.ChangeLaneDelay.min,
            TrafficSimConstants.Vehicles.ChangeLaneDelay.max
        ); // milliseconds
        this.maxSpeed = options?.maxSpeed || 260; // Kilometres per Hour
        
        this.#changeLaneTime = this.scene.time.now + this.changeLaneDelay;
    }

    /** in Metres / second on each axis */
    get velocity(): V2 {
        const vel = this.body.velocity;
        return {x: vel.x, y: vel.y};
    }
    /** in Metres / second */
    get speed(): number {
        const vel = this.velocity;
        return Utils.vector2(vel).length();
    }
    lookAt(location: V2): this {
        const pos = this.location;
        const radians: number = Phaser.Math.Angle.Between(location.x, location.y, pos.x, pos.y);
        this.gameObj.setRotation(radians);
        return this;
    }
    moveBy(amount: V2): this {
        const loc = this.location;
        const newL = Utils.vector2(loc.x, loc.y).add(amount);
        this.setLocation(newL);
        return this;
    }
    /**
     * rotates the `GameObject` by the specified amount in Radians
     * @param amount amount to rotate in Radians
     * @returns this
     */
    rotateBy(amount: number): this {
        const newR = this.rotation + amount;
        this.gameObj.setRotation(newR);
        return this;
    }
    applyForce(force: V2): this {
        const newV = Utils.vector2(this.velocity).add(force);
        this.body.setVelocity(newV.x, newV.y);
        // prevent going backwards
        const heading = this.heading;
        const Hv = Utils.vector2(heading).add(this.velocity);
        if (Math.abs(Hv.x) < Math.abs(heading.x) || Math.abs(Hv.y) < Math.abs(heading.y)) {
            this.body.setVelocity(0);
        }
        return this;
    }

    get roadMap(): RoadMap {
        return this.road.roadMap;
    }

    get road(): Road {
        return this.lane.road;
    }

    get lane(): Lane {
        return this.segment.lane;
    }
    
    get segment(): LaneSegment {
        return this.#laneSegment;
    }
    setSegment(segment: LaneSegment, location?: V2): this {
        if (segment) {
            this.#laneSegment = segment;
            if (location) {
                this.setLocation(location);
            } else {
                this.setLocation(segment.start);
            }
        }
        return this;
    }

    #nextReactionAt: number = 0;
    async update(time: number, delta: number): Promise<void> {
        if (this.segment) {
            this.lookAt(this.segment.end);
        }
        
        if (this.#nextReactionAt <= this.scene.time.now) {
            this.#state = this.getDesiredState();
            this.#nextReactionAt = this.scene.time.now + this.reactionTime;
        }

        if (this.isCrashed()) {
            // remove vehicle after appropriate time has passed
            if (this.#crashedAt + this.#crashCleanupTime <= this.scene.time.now) {
                // remove self from the Simulation
                // TODO: emit event
                return;
            }
        }

        this.updateSpeed(delta);
        this.updateColour();
    }

    get state(): VehicleState {
        return this.#state;
    }

    getDesiredState(): VehicleState {
        if (this.shouldDecelerate()) {
            return 'decelerating';
        }
        
        if (this.shouldAccelerate()) {
            return 'accelerating';
        }
            
        return 'coasting';
    }

    updateSpeed(elapsedMs: number): void {
        switch (this.state) {
            case 'accelerating':
                this.accelerate(elapsedMs);
                break;
            case 'decelerating':
                this.brake(elapsedMs);
                break;
            default:
                break;
        }
    }

    /**
     * sets the vehicle colour based on the current velocity
     */
    updateColour(): this {
        if (this.#crashedAt) {
            this.gameObj.fillColor = 0x9933ff; // purple
            return this;
        }

        const vel = this.speed;
        if (vel < Utils.convertKmphToMetresPerSec(1)) {
            this.gameObj.fillColor = 0xff0000; // red
        }
        if (Utils.convertKmphToMetresPerSec(1) <= vel && vel < Utils.convertKmphToMetresPerSec(30)) {
            this.gameObj.fillColor = 0xff9900; // orange
        }
        if (Utils.convertKmphToMetresPerSec(30) <= vel && vel < Utils.convertKmphToMetresPerSec(60)) {
            this.gameObj.fillColor = 0xffff00; // yellow
        }
        if (Utils.convertKmphToMetresPerSec(60) <= vel) {
            this.gameObj.fillColor = 0x66ff33; // green
        }
        return this;
    }

    setCrashed(vehicle: Vehicle): void {
        if (!this.#crashedAt) {
            this.#crashedAt = this.scene.time.now;
            this.#crashCleanupTime = 5000;
            // const maxVelocityMps: number = Math.max(this.getVelocity(), vehicle.getVelocity());
            // if (maxVelocityMps < Utils.convertKmphToMetresPerSec(15)) {
            //     this.#crashCleanupTime = Utils.getRandomFloat(
            //         SimulationConstants.Vehicles.CrashCleanupDelay.LowSpeed.min,
            //         SimulationConstants.Vehicles.CrashCleanupDelay.LowSpeed.max
            //     );
            // } else if (Utils.convertKmphToMetresPerSec(15) <= maxVelocityMps && maxVelocityMps < Utils.convertKmphToMetresPerSec(50)) {
            //     this.#crashCleanupTime = Utils.getRandomFloat(
            //         SimulationConstants.Vehicles.CrashCleanupDelay.MediumSpeed.min,
            //         SimulationConstants.Vehicles.CrashCleanupDelay.MediumSpeed.max
            //     );
            // } else if (Utils.convertKmphToMetresPerSec(50) <= maxVelocityMps) {
            //     this.#crashCleanupTime = Utils.getRandomFloat(
            //         SimulationConstants.Vehicles.CrashCleanupDelay.HighSpeed.min,
            //         SimulationConstants.Vehicles.CrashCleanupDelay.HighSpeed.max
            //     );
            // }
        }
    }

    isCrashed(): boolean {
        return this.#crashedAt != null;
    }

    setChangingLanes(isChanging: boolean): void {
        this.#isChangingLanes = isChanging;
        if (this.isChangingLanes()) {
            this.#changeLaneTime = this.scene.time.now + this.changeLaneDelay;
        }
    }

    isChangingLanes(): boolean {
        return this.#isChangingLanes;
    }

    accelerate(elapsedMs: number): void {
        const calculatedAcceleration = (this.acceleration / 1000) * elapsedMs;
        const force = Utils.vector2(this.heading).multiply(Utils.vector2(calculatedAcceleration));
        this.applyForce(force);
    }

    brake(elapsedMs: number): void {
        const calculatedDeceleration = (this.deceleration / 1000) * elapsedMs;
        const force = Utils.vector2(this.heading).multiply(Utils.vector2(calculatedDeceleration)).negate();
        this.applyForce(force);
    }

    shouldDecelerate(): boolean {
        if (this.isCrashed()) {
            return true;
        }
        
        // check for vehicles in range
        var stopForV: boolean = this.shouldStopForVehicles();
        if (stopForV) {
            let newSegment: LaneSegment = this.shouldChangeLanes();
            if (newSegment) {
                let changeLaneSegment: LaneSegment = this.lane.addSegment({
                    simulation: this.sim,
                    start: Utils.vector2(this.location),
                    end: Utils.getNearestPointAhead(this, newSegment.getLaneChangePoints()),
                    name: `${this.segment.id}_${newSegment.id}`,
                    speedLimit: newSegment.speedLimit
                });
                if (changeLaneSegment) {
                    this.setChangingLanes(true);
                    changeLaneSegment.addVehicle(this, changeLaneSegment.start);
                }
            }
            return true;
        }

        // check for traffic flow controllers in range that say "stop"
        var foundTfc: boolean = this.shouldStopForTfcs();
        if (foundTfc) {
            return true;
        }

        // check for corners
        var foundCorner: boolean = this.shouldSlowForCorner();
        if (foundCorner) { // and finally check for cornering in range
            return true;
        }

        return false;
    }

    shouldAccelerate(): boolean {
        if (this.isCrashed()) {
            return false;
        }
        if (this.segment?.speedLimit > Utils.convertMetresPerSecToKmph(this.speed)) {
            return true;
        }
        return false;
    }

    shouldStopForVehicles(): boolean {
        const ahead: Array<Vehicle> = this.getVehiclesAhead(this.stopDistance) || [];
        for (var i=0; i<ahead.length; i++) {
            let v = ahead[i];
            if (v.speed < this.speed) {
                return true;
            }
        }
        
        var intersecting: Vehicle[] = this.getIntersectingVehicles();
        if (intersecting?.length) {
            return true;
        }
    
        return false;
    }

    shouldStopForTfcs(): boolean {
        const ahead: Array<TrafficFlowControl<any>> = this.getTfcsAhead(this.stopDistance) || [];
        for (var i=0; i<ahead.length; i++) {
            let tfc = ahead[i];
            if (tfc.shouldStop(this)) {
                return true;
            }
        }
        return false;
    }

    shouldSlowForCorner(): boolean {
        // slow down when the next segment is in range and has a different heading
        const vehicleSegment = this.segment;
        const distance: number = this.stopDistance;
        let segEnd = vehicleSegment.end;
        var distanceToSegEnd = Utils.getLength(this.location, segEnd);
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1 = vehicleSegment.line;
            var nextSegments: LaneSegment[] = this.lane.getNextSegments(vehicleSegment);
            // TODO: only calculate for next segment on choosen path
            for (var i in nextSegments) {
                var nextSegment: LaneSegment = nextSegments[i];
                var line2 = nextSegment.line;
                var angle: number = Math.abs(Utils.angleFormedBy(line1, line2));
                if (angle > headingDiff) {
                    headingDiff = angle;
                }
            }

            var corneringSpeed: number = Utils.corneringSpeedCalculator(headingDiff);
            // begin slowing down
            if (this.speed > corneringSpeed) {
                return true;
            }
        }

        return false;
    }

    shouldChangeLanes(): LaneSegment {
        let newLane: LaneSegment;
        if (!this.isChangingLanes() && this.#changeLaneTime < this.scene.time.now) {
            let availableLanes: LaneSegment[] = this.road.getSimilarSegments(this.segment);
            for (var i=0; i<availableLanes.length; i++) {
                let availableLane: LaneSegment = availableLanes[i];
                // ensure availableLane is clear ahead
                let stopDist: number = this.stopDistance;
                let vehicles: Vehicle[] = this.getVehiclesAhead(stopDist * 2, availableLane);
                if (!vehicles?.length) {
                    newLane = availableLane;
                    break;
                }
            }
        }
        return newLane;
    }

    /**
     * compares the paths of nearby vehicles with this `vehicle` and it's view and returns an array
     * of other vehicles who can be seen and whose paths intesect with this one
     * @returns a `Array<Vehicle>` of vehicles whose paths intersect with this `vehicle` path
     */
    getIntersectingVehicles(): Array<Vehicle> {
        const intersecting = new Array<Vehicle>();
        const inView = this.roadMap.getVehiclesInView(this);
        const onCollisionCourse = this.roadMap.getVehiclesWithIntersectingPaths(this, inView);
        if (onCollisionCourse?.length) {
            intersecting.splice(0, 0, ...onCollisionCourse);
        }
        return intersecting;
    }

    /**
     * determines if the passed in `vehicle` can be seen
     * @param otherVehicle `vehicle` to be checked for visibility
     * @returns true if `otherVehicle` can be seen; otherwise false
     */
    hasInView(otherVehicle: Vehicle): boolean {
        const segment: LaneSegment = this.segment;
        if (segment) {
            var maxAngle = 45;
            if (segment?.isInlet) {
                maxAngle = 90;
            }
            const thisLoc = this.location;
            const otherLoc = otherVehicle.location;
            var headingLine = new Phaser.Geom.Line(thisLoc.x, thisLoc.y, segment?.end.x, segment?.end.y);
            var headingToLocation = new Phaser.Geom.Line(thisLoc.x, thisLoc.y, otherLoc.x, otherLoc.y);

            if (Math.abs(Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
                return true;
            }
        }
        return false;
    }

    /**
     * generates a triangle representing the viewable area for this vehicle based on speed
     */
    get viewAhead(): Phaser.Geom.Triangle {
        const viewStart = this.location;
        const stopDist = this.stopDistance;
        const distanceAhead = Utils.vector2(this.heading).multiply(Utils.vector2(stopDist)).add(viewStart);
        let radians: number;
        if (this.speed < 30) {
            radians = Utils.deg2rad(45);
        } else if (this.speed < 50) {
            radians = Utils.deg2rad(30);
        } else {
            radians = Utils.deg2rad(25);
        }
        const viewLeft = Phaser.Math.RotateAround(distanceAhead, viewStart.x, viewStart.y, -radians);
        const viewRight = Phaser.Math.RotateAround(distanceAhead, viewStart.x, viewStart.y, radians);
        const tri = new Phaser.Geom.Triangle(viewStart.x, viewStart.y, viewLeft.x, viewLeft.y, viewRight.x, viewRight.y);
        return tri;
    }

    /**
     * Reaction Distance: d = (s * r)
     *   d = reaction distance in metres (to be calculated).
     *   s = speed in m/s.
     *   r = reaction time in seconds.
     * Braking Time: t = (Vi - Vf) / d
     *   t = time to come to a complete stop (to be calculated)
     *   Vf = final velocity in m/s
     *   Vi = initial velocity in m/s
     *   d = deceleration
     * Braking Distance: d = Vavg * t
     *   d = braking distance in metres (to be calculated).
     *   Vavg = average velocity in m/s
     *   t = time to stop
     * @returns the distance required to safely stop in metres
     */
    get stopDistance(): number {
        const finalVel: number = 0;
        const reactionTimeSec = Utils.convertMillisecondsToSeconds(this.reactionTime);
        const speed = this.speed;
        const reactionDist = speed * reactionTimeSec;
        const brakingTime = (speed - finalVel) / this.deceleration;
        const brakingDist = Utils.getDistanceTravelled(speed, brakingTime * 1000, finalVel);
        return reactionDist + brakingDist + (TrafficSimConstants.Vehicles.Length.max * 1.5);
    }

    get stopDistanceIntersectionLine(): Phaser.Geom.Line {
        const dist: number = this.stopDistance;
        const offset: Phaser.Math.Vector2 = Utils.vector2(this.heading).multiply(Utils.vector2(dist));
        const loc = this.location;
        const pos: Phaser.Math.Vector2 = Utils.vector2(loc).add(offset);
        const line = new Phaser.Geom.Line(loc.x, loc.y, pos.x, pos.y);
        return line;
    }

    getVehiclesAhead(distance: number, segment?: LaneSegment): Array<Vehicle> {
        segment ??= this.segment;
        const distToEnd = Utils.getLength(this.location, segment.end);
        const ahead: Array<Vehicle> = segment.vehicles
            .filter(v => v.id !== this.id)
            .filter(v => Utils.getLength(v.location, this.location) <= distance)
            .filter(v => Utils.getLength(v.location, segment.end) <= distToEnd);
        if (distance > distToEnd) {
            // check next segment
            segment.nextSegments.forEach(seg => ahead.splice(0, 0, ...this.getVehiclesAhead(distance - distToEnd, seg)));
        }
        return ahead;
    }

    getTfcsAhead(distance: number, segment?: LaneSegment): Array<TrafficFlowControl<any>> {
        segment ??= this.segment;
        const distToEnd = Utils.getLength(this.location, segment.end);
        const ahead: Array<TrafficFlowControl<any>> = segment.tfcs
            .filter(tfc => tfc.id !== this.id)
            .filter(tfc => Utils.getLength(tfc.location, this.location) <= distance)
            .filter(tfc => Utils.getLength(tfc.location, segment.end) <= distToEnd);
        if (distance > distToEnd) {
            // check next segment
            segment.nextSegments.forEach(seg => ahead.splice(0, 0, ...this.getTfcsAhead(distance - distToEnd, seg)));
        }
        return ahead;
    }

    /**
     * Interface: GameObject
     */
    get gameObj(): Phaser.GameObjects.Rectangle {
        if (!this._gameObj) {
            this._gameObj = this.scene.add.rectangle(0, 0, this.length, this.width, 0x666666);
            this._gameObj.setOrigin(0.5);
            this._gameObj.setDepth(TrafficSimConstants.UI.Layers.Vehicles.Depth);
            this._gameObj.setInteractive();
            this._gameObj.on(Phaser.Input.Events.POINTER_DOWN, this._handleClick, this);
            this.scene.physics.add.existing(this._gameObj);
            this.body.setBounce(0.2, 0.2);
            this.body.setMaxVelocity(TrafficSimConstants.Vehicles.Speed.max, TrafficSimConstants.Vehicles.Speed.max);
            this.body.setDrag(1, 1);
        }
        return this._gameObj;
    }

    /**
     * Interface: Physics
     */
    get body(): Phaser.Physics.Arcade.Body {
        return this.gameObj.body as Phaser.Physics.Arcade.Body;
    }

    private _handleClick(): void {
        if (this.sim.activeVehicle?.id === this.id) {
            this.sim.activeVehicle = null;
        } else {
            this.sim.activeVehicle = this;
        }
    }

    dispose(): void {
        if (this.segment) {
            this.segment.removeVehicle(this);
        }
        if (this._gameObj) {
            this.scene.children.remove(this._gameObj);
            this._gameObj.destroy();
            this._gameObj = null;
        }
    }
}