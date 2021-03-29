import * as THREE from 'three';
import { TrafficObject } from '../objects/traffic-object';

export module Utils {
    var _id: number = 0;
    export const SECONDS_PER_HOUR: number = 3600;
    export const METERS_PER_KILOMETER: number = 1000;

    export function getNewId(): number {
        return _id++;
    }

    export function getRandomBetween(min: number, max: number): number {
		return Math.random() * (max - min) + min;
	}

	export function getDistanceBetweenTwoPoints(p1: THREE.Vector3, p2: THREE.Vector3): number {
        return new THREE.Line3(new THREE.Vector3().copy(p1), new THREE.Vector3().copy(p2)).distance();
    }

    export function angleFormedBy(line1: THREE.Line3, line2: THREE.Line3): number {
        var a = new THREE.Vector3().copy(line1.end).sub(line1.start).normalize();
        var b = new THREE.Vector3().copy(line2.end).sub(line2.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    }

    export function isCollidingWith(box1: THREE.Box3, box2: THREE.Box3) {
        if (box1 && box2) {
            return box1.intersectsBox(box2);
        }
        return false;
    }

    export function convertKmphToMetresPerSec(kilometersPerHour: number): number {
		var result = 0;
		result = (kilometersPerHour / SECONDS_PER_HOUR) * METERS_PER_KILOMETER;
		return result;
	}

	export function convertMetresPerSecToKmph(metersPerSecond: number): number {
		var result = 0;
		result = (metersPerSecond * SECONDS_PER_HOUR) / METERS_PER_KILOMETER;
		return result;
	}

    export function convertMsToHumanReadable(milliseconds: number): string {
        var x = milliseconds / 1000;
        var seconds: string = (Math.round((x % 60) * 100) / 100).toFixed(2);
        x /= 60;
        var minutes: string = Math.floor(x % 60).toString();
        x /= 60;
        var hours: string = Math.floor(x % 24).toString();

        var elapsedReadable: string = `${hours}:${minutes}:${seconds}`;

        return elapsedReadable;
    }

    export function corneringSpeedCalculator(headingAngle: number): number {
        if (headingAngle < 12) {
            // no real difference
            return this.velocity; // fast as you like
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
}