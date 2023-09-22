import { Path3D, Vector3 }from "@babylonjs/core";
import { Utils } from "./utils";

describe('Utils', () => {
    describe('angleFormedBy', () => {
        it('describes opposing parallel lines as 180', () => {
            const line1 = new Path3D([new Vector3(0, 0, 0), new Vector3(100, 0, 0)]);
            const line2 = new Path3D([new Vector3(100, 1, 0), new Vector3(0, 1, 0)]);

            const actual = Utils.angleFormedBy(line1, line2);
            expect(actual).toBe(180);
        })

        it('describes parallel lines as 0', () => {
            const line1 = new Path3D([new Vector3(0, 0, 0), new Vector3(100, 0, 0)]);
            const line2 = new Path3D([new Vector3(0, 1, 0), new Vector3(100, 1, 0)]);

            const actual = Utils.angleFormedBy(line1, line2);
            expect(actual).toBe(0);
        })

        /**
         * forces a value to be returned from the `Vector3.dot` function that is greater than 1
         * which then causes `Math.acos` to return `NaN`
         */
        it('returns a valid number when second line lies directly on first line at angle', () => {
            const line1 = new Path3D([new Vector3(0, 0, 0), new Vector3(-100, -100, 0)]);
            const line2 = new Path3D([new Vector3(0, 0, 0), new Vector3(-50, -50, 0)]);

            const actual = Utils.angleFormedBy(line1, line2);
            expect(actual).toBeCloseTo(0);
        })
    })

    describe('axisAngleFormedBy', () => {
        it('removes the zeroAxis from the equation', () => {
            const line1 = new Path3D([new Vector3(0, 0, 0), new Vector3(0, 100, 100)]);
            const line2 = new Path3D([new Vector3(0, 0, 0), new Vector3(100, 100, 0)]);
            
            const actualXZ = Utils.angleAxisFormedBy(line1, line2, 'y');
            expect(actualXZ).toBe(90);

            const actualXY = Utils.angleAxisFormedBy(line1, line2, 'z');
            expect(actualXY).toBe(45);

            const actualYZ = Utils.angleAxisFormedBy(line1, line2, 'x');
            expect(actualYZ).toBe(45);
        })
    })
});