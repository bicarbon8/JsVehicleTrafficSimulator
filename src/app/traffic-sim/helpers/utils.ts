import { Box3, Line3, MathUtils, Mesh, Object3D, PlaneGeometry, Vector3 } from 'three';
import { Renderable } from '../view/renderable';
import { TrafficObject } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { V3 } from './customTypes';

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

    /**
     * 
     * @param line1 
     * @param line2 
     * @returns the angle in degrees that each line differs by
     */
    export function angleFormedBy(line1: Line3, line2: Line3): number {
        const a = line1.end.clone().sub(line1.start.clone()).normalize();
        const b = line2.end.clone().sub(line2.start.clone()).normalize();
        // console.warn('vectors', {a}, {b});
        const dot = a.dot(b);
        if (dot > 1 || dot < -1) {
            return 0;
        }
        const acos = Math.acos(dot);
        // console.warn('results', {dot}, {acos});
        return MathUtils.radToDeg(acos);
    }

    /**
     * similar to `Utils.angleFormedBy`, but first zero's out one axis on both lines to make the angle
     * calculation result be across only 2 dimensions. for example, to get a left / right heading angle
     * you would specify a `zeroAxis` of `y` (up / down) thereby making the angle calculation account for
     * differences in only the `x` (left / right) and `z` (forwards / backwards) axis
     * @param line1 
     * @param line2 
     * @param zeroAxis the axis to zero out before computing the angle thereby making the computation 2D
     * @returns the angle in degrees that each line differs by across two axis
     */
    export function angleAxisFormedBy(line1: Line3, line2: Line3, zeroAxis: 'x' | 'y' | 'z'): number {
        const zAxisVect = new Vector3(1, 1, 1);
        switch (zeroAxis) {
            case 'x':
                zAxisVect.x = 0;
                break;
            case 'y': 
                zAxisVect.y = 0;
                break;
            case 'z':
                zAxisVect.z = 0;
                break;
        }
        const l1 = new Line3(line1.start.clone().multiply(zAxisVect), line1.end.clone().multiply(zAxisVect));
        const l2 = new Line3(line2.start.clone().multiply(zAxisVect), line2.end.clone().multiply(zAxisVect));
        return Utils.angleFormedBy(l1, l2);
    }

    export function isCollidingWith<T extends Mesh>(obj1: T, obj2: T): boolean {
        if (obj1 && obj2) {
            const b1: Box3 = new Box3().setFromObject(obj1);
            const b2: Box3 = new Box3().setFromObject(obj2);
            return b1.intersectsBox(b2);
        }
        return false;
    }

    export function containsPoint<T extends Mesh>(obj: T, point: Vector3): boolean {
        if (obj && point) {
            const box = new Box3().setFromObject(obj);
            return box.containsPoint(point);
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
     * calculates the maximum angle that a vehicle can turn given it's speed
     * to prevent skidding
     * @param speed in metres per second
     * @returns the maximum angle that can be turned for the given speed
     */
    export function turnRateCalculator(speed: number): number {
        if (speed > 150) {
            return 12;
        }
        if (speed > 100) {
            return 25;
        }
        if (speed > 30) {
            return 45;
        }
        if (speed > 10) {
            return 90;
        }
        if (speed > 5) {
            return 135
        }
        if (speed <= 5) {
            return 180;
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
     * @param speed the speed in Metres per Second
     * @param elapsedMs the time in milliseconds
     */
    export function getDistanceTravelled(speed: number, elapsedMs: number): number {
        return speed * convertMillisecondsToSeconds(elapsedMs);
    }

    /**
     * calculates the location of a point some distance between `pointA` and `pointB` starting
     * from `pointA`
     * @param pointA starting point
     * @param pointB end point
     * @param distance the distance from the starting point to go
     * @returns a `Vector3` that lies some `distance` in between `pointA` and `pointB`
     */
    export function getPointInBetweenByDistance(pointA: Vector3, pointB: Vector3, distance: number): Vector3 {
        const dir = pointB.clone().sub(pointA).normalize().multiplyScalar(distance);
        return pointA.clone().add(dir);
    }

    /**
     * calculates the location of a point some percentage distance between `pointA` and
     * `pointB` starting from `pointA`
     * @param pointA starting point
     * @param pointB end point
     * @param percentage the percentage from the starting point to go
     * @returns a `Vector3` that lies some `percentage` distance in between `pointA` and `pointB`
     */
    export function getPointInBetweenByPercent(pointA: Vector3, pointB: Vector3, percentage: number): Vector3 {
        const delta = pointB.clone().sub(pointA);
        const len = delta.length();
        const dir = delta.normalize().multiplyScalar(len * percentage);
        return pointA.clone().add(dir);
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

    /**
     * assumes that the +z direction is forwards and uses this to get the
     * heading of an `Object3D` based on it's rotation (the location of it's
     * +z face(s))
     * @param obj the `Object3D` to get a heading from
     * @param forwardAxis a string indicating which vector is forwards: x, y, or z @default z
     * @returns a `Vector3` representing the heading as a normalised vector
     */
    export function getHeading(obj: TrafficObject, forwards: V3 = {x:0, y:0, z:1}): Vector3 {
        const forwardVector = new Vector3(forwards.x, forwards.y, forwards.z);
        return forwardVector.applyQuaternion(obj.rotation).normalize();
    }

    /**
     * assumes that the +z direction is forwards and uses this to get the
     * heading of an `Object3D` based on it's rotation (the location of it's
     * +z face(s))
     * @param obj the `Object3D` to get a heading line from
     * @param forwardAxis a string indicating which vector is forwards: x, y, or z
     * @returns a `Line3` representing a ray direction
     */
    export function getHeadingLine(obj: TrafficObject, forwards?: V3): Line3 {
        const dir = Utils.getHeading(obj, forwards);
        const start = obj.location;
        const scalar = (obj as Vehicle)?.getLookAheadDistance() || 1;
        const end = start.clone().addScaledVector(dir, scalar);
        return new Line3(start, end);
    }

    /**
     * indicates if two points are within a certain range of eachother
     * @param p1 the first point
     * @param p2 the second point
     * @param range the maximum distance allowed
     * @returns `true` if the first and second points are within the specified distance
     */
    export function isWithinRange(p1: Vector3, p2: Vector3, range: number): boolean {
        return new Line3(p1, p2).distance() <= Math.abs(range);
    }

    /**
     * fuzzy equality comparison between two numbers where each must be within the 
     * specified `offset` from eachother to be considered equal
     * @param a the first number
     * @param b the second number
     * @param offset the maximum difference allowed to be considered equal
     * @returns `true` if the first and second number are within the specified `offset`
     * from eachother (inclusive), otherwise `false`
     */
    export function fuzzyEquals(a: number, b: number, offset: number = 0.1): boolean {
        if (a > b) {
            return a - b <= offset;
        } else if (b > a) {
            return b - a <= offset;
        } else {
            return true;
        }
    }

    /**
     * predicts a vehicle's location in the future based on current speed and heading
     * @param vehicle the `Vehicle` to predict a location of
     * @param deltaTimeMs the amount of milliseconds in the future to predict
     * @returns a `Vector3` indicating the new location of the passed in vehicle
     * at the specified time in the future if no other changes occur
     */
    export function predictLocationAtTime(vehicle: Vehicle, deltaTimeMs: number): Vector3 {
        if (Utils.fuzzyEquals(vehicle.speed, 0, 0.01)) {
            return vehicle.location;
        }
        const dist = Utils.getDistanceTravelled(vehicle.speed, deltaTimeMs);
        const heading = Utils.getHeading(vehicle);
        const loc = vehicle.location;
        return loc.add(heading.multiplyScalar(dist));
    }

    /**
     * calculates, based on a vehicle's current lane, where it will be in the future
     * given its speed and assuming no changes applied during the time
     * @param vehicle the `Vehicle` to calculate a location of
     * @param deltaTimeMs the amount of time in milliseconds in the future to calculate
     * @returns a `Vector3` indicating the new location of the passed in vehicle at
     * the specified time in the future if no other changes occur
     */
    export function calculateLocationAtTime(vehicle: Vehicle, deltaTimeMs: number): Vector3 {
        if (Utils.fuzzyEquals(vehicle.speed, 0, 0.01)) {
            return vehicle.location;
        }
        const dist = Utils.getDistanceTravelled(vehicle.speed, deltaTimeMs);
        let start = vehicle.location;
        let segment = vehicle.segment;
        let remaining = dist;
        while (remaining > Utils.getLength(start, segment.end)) {
            const nextSegments = vehicle.simMgr.mapManager.getSegmentsContainingPoint(segment.end);
            if (nextSegments?.length > 0) {
                remaining -= Utils.getLength(start, segment.end);
                start = segment.end;
                segment = nextSegments[Utils.getRandomIntBetween(0, nextSegments.length)];
            } else {
                return null; // vehicle won't exist
            }
        }
        return Utils.getPointInBetweenByDistance(start, segment.end, remaining);
    }
}