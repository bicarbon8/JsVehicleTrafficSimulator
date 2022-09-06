import * as uuid from 'uuid';
import { V2 } from '../interfaces/custom-types';
import { Positionable } from '../interfaces/positionable';
import { Vehicle } from '../objects/vehicles/vehicle';
import { TrafficSim } from '../view/traffic-sim';

export class Utils {
    static guid(): string {
        return uuid.v4();
    }

    static getRandomInt(min: number, max: number): number {
        return Math.floor(Utils.getRandomFloat(min, max));
    }

    static getRandomFloat(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

    /**
     * uses `Phaser.Math.Distance.BetweenPoints` to calculate the distance between two points
     * @param p1 first point
     * @param p2 second point
     * @returns the distance between two points
     */
	static getLength(p1: V2, p2: V2): number {
        return Phaser.Math.Distance.BetweenPoints(p1, p2);
    }

    static getLineLength(line: Phaser.Geom.Line): number {
        const start = line.getPointA();
        const end = line.getPointB();
        return Utils.getLength(start, end);
    }

    static angleFormedBy(line1: Phaser.Geom.Line, line2: Phaser.Geom.Line): number {
        var a = line1.getPointB().clone().subtract(line1.getPointA().clone()).normalize();
        var b = line2.getPointB().clone().subtract(line2.getPointA().clone()).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    }

    static getNearestPointAhead(vehicle: Vehicle, points: Array<Phaser.Types.Math.Vector2Like>): Phaser.Math.Vector2 {
        let closestPoint: Phaser.Math.Vector2;
        const currentLoc = vehicle.location;
        const headingLine = vehicle.stopDistanceIntersectionLine;
        for (var j=0; j<points.length; j++) {
            let point: Phaser.Types.Math.Vector2Like = points[j];
            let line1 = new Phaser.Geom.Line(currentLoc.x, currentLoc.y, point.x, point.y);
            let angle: number = Math.abs(Utils.angleFormedBy(line1, headingLine));
            // TODO: base angle on speed where greater angles allowed at lower speeds
            if (angle <= 25 && angle > 5) {
                if (!closestPoint) {
                    closestPoint = Utils.vector2(point.x, point.y);
                } else {
                    if (Utils.getLineLength(line1) < Utils.getLength(closestPoint, currentLoc)) {
                        closestPoint = Utils.vector2(point.x, point.y);
                    }
                }
            }
        }
        return closestPoint;
    }

    static intersects(line1: Phaser.Geom.Line, line2: Phaser.Geom.Line): boolean {
        return Phaser.Geom.Intersects.LineToLine(line1, line2);
    }

    static convertKmphToMetresPerSec(kilometersPerHour: number): number {
		return kilometersPerHour / 3.6;
	}

	static convertMetresPerSecToKmph(metersPerSecond: number): number {
		return metersPerSecond * 3.6;
	}

    static convertMillisecondsToSeconds(ms: number): number {
        return ms / 1000;
    }

    static convertMillisecondsToMinutes(ms: number): number {
        return Utils.convertMillisecondsToSeconds(ms) / 60;
    }

    static convertMillisecondsToHours(ms: number): number {
        return Utils.convertMillisecondsToMinutes(ms) / 60;
    }

    static convertMsToHumanReadable(milliseconds: number): string {
        var x = milliseconds / 1000;
        var seconds: string = (Math.round((x % 60) * 100) / 100).toFixed(2);
        x /= 60;
        var minutes: string = Math.floor(x % 60).toString();
        x /= 60;
        var hours: string = Math.floor(x % 24).toString();
        x /= 24;
        let days: string = Math.floor(x).toString();

        var elapsedReadable: string = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        return elapsedReadable;
    }

    /**
     * returns the maximum safe speed to take a corner in Metres per Second
     * @param headingAngle the angle difference between the current `RoadSegment` and
     * the next
     * @returns a value for the max safe speed in Metres per Second
     */
    static corneringSpeedCalculator(headingAngle: number): number {
        if (headingAngle < 12) {
            // no real difference
            return Infinity; // fast as you like
        }
        if (headingAngle < 25) {
            // mild / gentle curve
            return Utils.convertKmphToMetresPerSec(100); // don't exceed 100 Km/h
        }
        if (headingAngle < 45) {
            return Utils.convertKmphToMetresPerSec(30);
        }
        if (headingAngle < 90) {
            return Utils.convertKmphToMetresPerSec(10);
        }
        if (headingAngle < 135) {
            return Utils.convertKmphToMetresPerSec(5);
        }
        if (headingAngle >= 135) {
            return Utils.convertKmphToMetresPerSec(1);
        }
    }

    /**
     * returns the distance based on the below formula
     * `d = Vavg * t`
     * 
     * where:
     * `d` = distance in metres
     * `Vavg` = average velocity in Metres per Second
     * `t` = time in Seconds
     * @param vStart the speed in Metres per Second
     * @param elapsedMs the time in milliseconds
     */
    static getDistanceTravelled(vStart: number, elapsedMs: number, vEnd?: number): number {
        vEnd ??= vStart;
        return ((vStart + vEnd) / 2) * Utils.convertMillisecondsToSeconds(elapsedMs);
    }

    static isWithinDistance(p1: V2, p2: V2, distance: number): boolean {
        return Utils.getLength(p1, p2) <= distance;
    }

    /**
     * determines if a value is between two others
     * @param min the minimum value
     * @param max the maximum value
     * @param val the actual value
     * @returns true if `val` is greater than or equal to `min` and less than
     * or equal to `max`
     */
    static isBetween(min: number, max: number, val: number): boolean {
        return (min <= val && val <= max);
    }

    /**
     * calculates new velocity based on the following formula:
     * `Vf = Vi + A * t`
     * 
     * where:
     * `Vf` is the final velocity in Metres per Second
     * `Vi` is the current velocity in Metres per Second
     * `A` is the `acceleration` in Metres per Second
     * `t` is the elapsed time in Seconds
     * @param initialVelocityMps the initial velocity in Metres per Second
     * @param accelerationMps the rate of acceleration in Metres per Second (use negative to slow down)
     * @param elapsedMs amount of time, in milliseconds, elapsed since last update
     */
    static getNewVelocity(initialVelocityMps: number, accelerationMps: number, elapsedMs: number): number {
        const elapsedSeconds: number = Utils.convertMillisecondsToSeconds(elapsedMs);
        return initialVelocityMps + accelerationMps * elapsedSeconds;
    }

    /**
     * Reaction Distance: d = (s * r)
     *   d = reaction distance in metres (to be calculated).
     *   s = speed in m/s.
     *   r = reaction time in seconds.
     * Braking Time: t = (Vi - Vf) / -a
     *   t = time to come to a complete stop (to be calculated)
     *   Vf = final velocity in m/s
     *   Vi = initial velocity in m/s
     *   a = acceleration
     * Braking Distance: d = Vavg * t
     *   d = braking distance in metres (to be calculated).
     *   Vavg = average velocity in m/s
     *   t = time to stop
     * @param currentVelocityMps the current speed in Metres per Second
     * @param reactionTimeMs the time to react before braking in milliseconds
     * @param deceleration the rate of deceleration in Metres per Second
     * @returns the distance required to safely stop in metres
     */
    static getStopDistance(currentVelocityMps: number, reactionTimeMs: number, deceleration: number): number { 
        const finalVel: number = 0;
        const reactionTimeSec = Utils.convertMillisecondsToSeconds(reactionTimeMs);
        const reactionDist = currentVelocityMps * reactionTimeSec;
        const brakingTime = (currentVelocityMps - finalVel) / deceleration;
        const brakingDist = ((currentVelocityMps + finalVel) / 2) * brakingTime;
        return reactionDist + brakingDist + this.length;
    }

    /**
     * get the number of elements in an enum.
     * <p>
     * ex: <i>enum Foo { bar = 0, baz = 1, boz = 2 }</i><br />
     * returns: <b>3</b>
     * </p>
     * @param enumType the type name of an enum
     * @returns the number of elements in the enum
     */
     static enumLength(enumType: any): number {
        let count = 0;
        for(let item in enumType) {
            if(isNaN(Number(item))) {
                count++;
            }
        }
        return count;
    }

    /**
     * returns a `Phaser.Math.Vector2` that represents a normalised vector of direction
     * based on the passed in rotation
     * @param angle the rotation in Degrees
     */
    static getHeading(angle: number): V2 {
        let x: number = Math.cos(Utils.deg2rad(angle));
        let y: number = Math.sin(Utils.deg2rad(angle));
        return new Phaser.Math.Vector2(x, y).normalize().negate();
    }

    static vector2(x: number | V2 = 0, y?: number): Phaser.Math.Vector2 {
        if (typeof x === "number") {
            if (y == null) {
                y = x;
            }
            return new Phaser.Math.Vector2(x, y);
        } else {
            return new Phaser.Math.Vector2(x.x, x.y);
        }
    }

    static rad2deg(radians: number): number {
        // 1Rad × 180/π
        return Phaser.Math.RadToDeg(radians); // radians * (180 / Math.PI);
    }

    static deg2rad(degrees: number): number {
        // 1Deg × π/180
        return Phaser.Math.DegToRad(degrees); // degrees * (Math.PI / 180);
    }

    /**
     * converts location in coordinate space to the location within the viewable area.
     * NOTE: this assumes that the camera is always centred on the view and moves with
     * the player
     * @returns a {Phaser.Math.Vector2} location within current viewable area
     */
    static convertLocToLocInView(location: Phaser.Math.Vector2, scene: Phaser.Scene): Phaser.Math.Vector2 {
        // NOTE: point 0,0 for the camera is the centre of the canvas where the ship appears
        let cameraPos: Phaser.Math.Vector2 = scene.cameras.main.getWorldPoint(0, 0);
        return new Phaser.Math.Vector2(location.x - cameraPos.x, location.y - cameraPos.y).negate();
    }
}