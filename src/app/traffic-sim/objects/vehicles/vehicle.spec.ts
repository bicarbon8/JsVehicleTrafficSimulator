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
            accelerationRate: 1, // Metres per Second
            maxSpeed: Infinity,
            length: 4,
            width: 2,
            height: 1
        }, simMgr);
        vehicle.hasPhysics = true;
        segment.addVehicle(vehicle, segment.start);
        vehicle.lookAt(segment.end);
        simMgr.update(1000); // 1 second elapsed

        const actual = vehicle.speed; // should be 1 m/s

        expect(1).withContext('speed').toEqual(actual);
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
            length: 4,
            width: 2,
            height: 1
        }, simMgr);
        vehicle.hasPhysics = true;
        segment.addVehicle(vehicle);

        let actual: number = vehicle.getLookAheadDistance();
        expect(vehicle.speed).withContext('before update speed').toEqual(0);
        expect(8).withContext('look ahead distance at rest').toEqual(actual);

        simMgr.update(1000); // speed should now be 1 m/s
        
        expect(vehicle.speed).withContext('after update speed').toEqual(1);

        actual = vehicle.getLookAheadDistance();
        expect(9).withContext('look ahead distance at speed').toBeCloseTo(actual, 0.1);
    });
});