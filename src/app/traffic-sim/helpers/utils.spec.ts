import { Line3, Vector3 } from "three";
import { Utils } from "./utils";

describe('Utils', () => {
    describe('axisAngleFormedBy', () => {
        it('removes the zeroAxis from the equation', () => {
            const line1 = new Line3(new Vector3(0, 0, 0), new Vector3(0, 100, 100));
            const line2 = new Line3(new Vector3(0, 0, 0), new Vector3(100, 100, 0));
            
            const actualXZ = Utils.angleAxisFormedBy(line1, line2, 'y');
            expect(actualXZ).toBe(90);

            const actualXY = Utils.angleAxisFormedBy(line1, line2, 'z');
            expect(actualXY).toBe(45);

            const actualYZ = Utils.angleAxisFormedBy(line1, line2, 'x');
            expect(actualYZ).toBe(45);
        })
    })
});