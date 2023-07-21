import { Box3, Line3, Object3D, Vector3 } from 'three';
import { Renderable } from '../view/renderable';

export module Utils {
    var _id: number = 0;
    
    export function getNewId(): number {
        return _id++;
    }

    /**
     * generates a random real number between the `min` (inclusive) and `max` (exclusive)
     * @param min lowest possible number that can be returned (inclusive)
     * @param max maximum limit used in selecting a random number (exclusive)
     * @returns a real (fractional) number between `min` (inclusive) and `max` (exclusive)
     */
    export function getRandomRealBetween(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

    /**
     * generates a random integer between the `min` (inclusive) and `max` (exclusive)
     * @param min lowest possible integer that can be returned (inclusive)
     * @param max maximum limit used in selecting a random integer (exclusive)
     * @returns an integer between `min` (inclusive) and `max` (exclusive)
     */
    export function getRandomIntBetween(min: number, max: number): number {
        return Math.floor(Utils.getRandomRealBetween(Math.ceil(min), Math.floor(max)));
    }

	export function getLength(p1: Vector3, p2: Vector3): number {
        return new Line3(p1, p2).distance();
    }

    export function angleFormedBy(line1: Line3, line2: Line3): number {
        var a = line1.end.clone().sub(line1.start.clone()).normalize();
        var b = line2.end.clone().sub(line2.start.clone()).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    }

    export function isCollidingWith<T extends Renderable>(obj1: T, obj2: T): boolean {
        if (obj1 && obj2) {
            let b1: Box3 = new Box3().setFromObject(obj1.mesh);
            let b2: Box3 = new Box3().setFromObject(obj2.mesh);
            return b1.intersectsBox(b2);
        }
        return false;
    }

    export function convertKmphToMetresPerSec(kilometersPerHour: number): number {
		return kilometersPerHour / 3.6;
	}

	export function convertMetresPerSecToKmph(metersPerSecond: number): number {
		return metersPerSecond * 3.6;
	}

    export function convertMillisecondsToSeconds(ms: number): number {
        return ms / 1000;
    }

    export function convertMillisecondsToMinutes(ms: number): number {
        return convertMillisecondsToSeconds(ms) / 60;
    }

    export function convertMillisecondsToHours(ms: number): number {
        return convertMillisecondsToMinutes(ms) / 60;
    }

    export function convertMsToHumanReadable(milliseconds: number): string {
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

    export function corneringSpeedCalculator(headingAngle: number): number {
        if (headingAngle < 12) {
            // no real difference
            return Infinity; // fast as you like
        }
        if (headingAngle < 25) {
            // mild / gentle curve
            return 100; // don't exceed 100 Km/h
        }
        if (headingAngle < 45) {
            return 30;
        }
        if (headingAngle < 90) {
            return 10;
        }
        if (headingAngle < 135) {
            return 5;
        }
        if (headingAngle >= 135) {
            return 1;
        }
    }

    /**
     * returns the distance based on the below formula
     * `d = v * t`
     * 
     * where:
     * `d` = distance in metres
     * `v` = {velocity} in Metres per Second
     * `t` = time in Seconds
     * @param velocity the speed in Metres per Second
     * @param elapsedMs the time in milliseconds
     */
    export function getDistanceTravelled(velocity: number, elapsedMs: number): number {
        return velocity * convertMillisecondsToSeconds(elapsedMs);
    }

    /**
     * rotates the supplied `obj` around the `centre` point by the supplied `radians` using
     * the supplied `axis`
     * @param obj the `Object3D` to rotate
     * @param centre the point around which to rotate
     * @param axis a normalised `Vector3` indicating the axis of rotation
     * @param radians the radians to rotate
     */
    export function rotateAround(obj: Object3D, centre: Vector3, axis: Vector3, radians: number): void {
        obj.position.sub(centre);
        obj.position.applyAxisAngle(axis, radians);
        obj.position.add(centre);
        obj.rotateOnAxis(axis, radians);
    }
}