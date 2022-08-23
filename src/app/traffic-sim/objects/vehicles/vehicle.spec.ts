import { Vehicle } from "./vehicle";

describe('Vehicle', () => {
    it('can accelerate based on acceleration in Metres per Second', () => {
        let vehicle: Vehicle = new Vehicle({
            acceleration: 100, // Metres per Second
            maxSpeed: Infinity
        });
        vehicle.accelerate(1000); // 1 second

        let actual: number = vehicle.getVelocity();
        expect(100).toEqual(actual);
    });

    it('can generate appropriate lookahead distance', () => {
        let vehicle: Vehicle = new Vehicle({
            acceleration: 1, // Metres per Second
            deceleration: 1,
            length: 4
        });

        let actual: number = vehicle.getStopDistance();
        expect(6).toEqual(actual);

        vehicle.accelerate(1000); // speed should now be 1 Metre per Second

        actual = vehicle.getStopDistance();
        expect(6.75).toEqual(actual);
    });
});