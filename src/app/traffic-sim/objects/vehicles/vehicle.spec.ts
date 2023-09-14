import { Vector3 } from "three";
import { RoadSegment } from "../../map/road-segment";
import { Vehicle } from "./vehicle";
import { SimulationManager } from "../../simulation-manager";

describe('Vehicle', () => {
    it('can accelerate based on acceleration in Metres per Second', () => {
        const simMgr = new SimulationManager();
        const segment: RoadSegment = new RoadSegment({
            start: new Vector3(0, 0, 0),
            end: new Vector3(100, 0, 0),
            speedLimit: Infinity
        }, simMgr);
        simMgr.mapManager.addSegment(segment);
        const vehicle: Vehicle = new Vehicle({
            accelerationRate: 100, // Metres per Second
            maxSpeed: Infinity
        }, simMgr);
        segment.addVehicle(vehicle);
        vehicle.accelerate(1000); // 1 second

        let actual: number = vehicle.speed;
        expect(100).toEqual(actual);
    });

    it('can generate appropriate lookahead distance', () => {
        const simMgr = new SimulationManager();
        const segment: RoadSegment = new RoadSegment({
            start: new Vector3(0, 0, 0),
            end: new Vector3(100, 0, 0),
            speedLimit: Infinity
        }, simMgr);
        simMgr.mapManager.addSegment(segment);
        const vehicle: Vehicle = new Vehicle({
            accelerationRate: 1, // Metres per Second
            maxDecelerationRate: 1,
            length: 4
        }, simMgr);
        segment.addVehicle(vehicle);

        let actual: number = vehicle.getLookAheadDistance();
        expect(vehicle.speed).toEqual(0);
        expect(8).toEqual(actual);

        vehicle.accelerate(1000); // speed should now be 1 Metre per Second

        actual = vehicle.getLookAheadDistance();
        expect(9).toEqual(actual);
    });
});