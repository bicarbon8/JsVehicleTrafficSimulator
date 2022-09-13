import * as uuid from 'uuid';
import { V2 } from '../interfaces/custom-types';
import { Vehicle } from '../objects/vehicles/vehicle';

export class Utils {
    static guid(): string {
        return uuid.v4();
    }

    static getRandomInt(min: number, max: number): number {
        return Math.floor(Utils.getRandomFloat(min, max));
    }

    static getRandomFloat(min: number, max: number): number {
		return Phaser.Math.RoundTo(Math.random() * (max - min) + min, -3);
	}

    /**
     * uses `Phaser.Math.Distance.BetweenPoints` to calculate the distance between two points
     * @param p1 first point
     * @param p2 second point
     * @returns the distance between two points
     */
	static getLength(p1: V2, p2: V2): number {
        return Phaser.Math.RoundTo(Phaser.Math.Distance.BetweenPoints(p1, p2), -3);
    }

    static getLineLength(line: Phaser.Geom.Line): number {
        const start = line.getPointA();
        const end = line.getPointB();
        return Phaser.Math.RoundTo(Utils.getLength(start, end), -3);
    }

    static angleFormedBy(line1: Phaser.Geom.Line, line2: Phaser.Geom.Line): number {
        var a = line1.getPointB().clone().subtract(line1.getPointA().clone()).normalize();
        var b = line2.getPointB().clone().subtract(line2.getPointA().clone()).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    }

    static getNearestPointAhead(vehicle: Vehicle, points: Array<Phaser.Types.Math.Vector2Like>): V2 {
        let closestPoint: V2;
        const currentLoc = vehicle.location;
        const headingLine = vehicle.stopDistanceIntersectionLine;
        for (var j=0; j<points.length; j++) {
            let point: Partial<V2> = points[j];
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
		return Phaser.Math.RoundTo(kilometersPerHour / 3.6, -3);
	}

	static convertMetresPerSecToKmph(metersPerSecond: number): number {
		return Phaser.Math.RoundTo(metersPerSecond * 3.6, -3);
	}

    static convertMillisecondsToSeconds(ms: number): number {
        return Phaser.Math.RoundTo(ms / 1000, -3);
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
        if (headingAngle < 5) {
            // no real difference
            return Infinity; // fast as you like
        }
        if (headingAngle < 25) {
            // mild / gentle curve
            return Utils.convertKmphToMetresPerSec(30); // don't exceed 100 Km/h
        }
        if (headingAngle < 45) {
            return Utils.convertKmphToMetresPerSec(15);
        }
        if (headingAngle < 90) {
            return Utils.convertKmphToMetresPerSec(5);
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
    
    /**
     * determines if two vectors are within a specified distance of eachother
     * @param p1 a `V2` type
     * @param p2 a `V2` type
     * @param distance the distance to compare against
     * @returns `true` if the two `V2` types are within the specified `distance` of eachother
     * otherwise `false`
     */
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
     * returns a `V2` that represents a normalised vector of direction
     * based on the passed in rotation
     * @param angle the rotation in Radians
     */
    static getHeading(angle: number): V2 {
        let x: number = Math.cos(angle);
        let y: number = Math.sin(angle);
        return Utils.lowerPrecision(Utils.vector2(x, y).normalize().negate());
    }

    /**
     * returns a perpendicular vector of direction pointing left from
     * the direction of the passed in `V2` (anticlockwise)
     * @param vector an object of type `V2`
     * @returns a `V2` representing a normalised vector of direction
     */
    static getPerpendicular(vector: V2): V2 {
        vector = Utils.lowerPrecision(vector);
        const vect = Utils.vector2(vector).normalize();
        const line = new Phaser.Geom.Line(0, 0, vect.x, vect.y);
        const perp = Phaser.Geom.Line.GetNormal(line);
        const perpAngle = Utils.getAngle(perp);
        return Utils.getHeading(perpAngle);
    }

    /**
     * calculates the angle of a vector in Radians
     * @param vector an object of type `V2`
     * @returns the angle of the vector in Radians
     */
    static getAngle(vector: V2): number {
        vector = Utils.lowerPrecision(vector);
        const vect = Utils.vector2(vector).normalize();
        const angle = Phaser.Math.Angle.Between(0, 0, vect.x, vect.y);
        return Phaser.Math.Angle.Normalize(angle);
    }

    static vector2(x: number | V2 = 0, y?: number): Phaser.Math.Vector2 {
        if (typeof x === "number") {
            if (y == null) {
                y = x;
            }
            return new Phaser.Math.Vector2(Utils.lowerPrecision({x: x, y: y}));
        } else {
            return new Phaser.Math.Vector2(Utils.lowerPrecision({x: x.x, y: x.y}));
        }
    }

    static lowerPrecision(input: V2): V2 {
        return {x: Phaser.Math.RoundTo(input.x, -3), y: Phaser.Math.RoundTo(input.y, -3)};
    }

    static rad2deg(radians: number): number {
        // 1Rad × 180/π
        return Phaser.Math.Angle.Normalize(Phaser.Math.RoundTo(Phaser.Math.RadToDeg(radians), -3)); // radians * (180 / Math.PI);
    }

    static deg2rad(degrees: number): number {
        // 1Deg × π/180
        return Phaser.Math.RoundTo(Phaser.Math.DegToRad(degrees), -3); // degrees * (Math.PI / 180);
    }

    /**
     * converts location in coordinate space to the location within the viewable area.
     * NOTE: this assumes that the camera is always centred on the view and moves with
     * the player
     * @returns a {Phaser.Math.Vector2} location within current viewable area
     */
    static convertLocToLocInView(location: V2, scene: Phaser.Scene): V2 {
        // NOTE: point 0,0 for the camera is the centre of the canvas where the ship appears
        const cameraPos = scene.cameras.main.getWorldPoint(0, 0);
        return Utils.lowerPrecision(Utils.vector2(location.x - cameraPos.x, location.y - cameraPos.y).negate());
    }
}