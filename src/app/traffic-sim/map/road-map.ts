import { TrafficSimConstants } from "../helpers/traffic-sim-constants";
import { Utils } from "../helpers/utils";
import { SimulationObject, SimulationObjectOptions } from "../objects/simulation-object";
import { Vehicle } from "../objects/vehicles/vehicle";
import { Lane } from "./lane";
import { LaneSegment } from "./lane-segment";
import { Road, RoadOptions } from "./road";

export type RoadMapOptions = SimulationObjectOptions & {
    roads?: Array<RoadOptions>
};

export class RoadMap extends SimulationObject {
    #roads: Map<string, Road>;
    
    constructor(options: RoadMapOptions) {
        super(options);

        this.#roads = new Map<string, Road>();
        options.roads?.forEach(road => this.addRoad(road));
    }

    addRoad(roadOpts: RoadOptions): this {
        roadOpts.roadMap = this;
        roadOpts.simulation = this.sim;
        const road = new Road(roadOpts);
        this.#roads.set(road.id, road);
        return this;
    }

    get roads(): Array<Road> {
        return Array.from(this.#roads.values());
    }

    getRoad(id: string): Road {
        return this.#roads.get(id);
    }

    getNextRoads(roadOrId: Road | string): Array<Road> {
        let road: Road;
        if (typeof roadOrId === "string") {
            road = this.#roads.get(roadOrId);
        } else {
            road = roadOrId;
        }
        return this.roads.filter(r => Utils)
    }

    getLane(id: string): Lane {
        return this.roads.find(r => r.getLane(id) != null).getLane(id);
    }

    getLaneSegment(id: string): LaneSegment {
        return this.roads.find(r => r.getLaneSegment(id)).getLaneSegment(id);
    }

    get vehicles(): Array<Vehicle> {
        const vArr = new Array<Vehicle>();
        this.roads.forEach(road => road.lanes.forEach(lane => lane.segments.forEach(seg => {
            let segmentVehicles = seg.vehicles;
            if (segmentVehicles?.length) {
                vArr.splice(0, 0, ...segmentVehicles);
            }
        })));
        return vArr;
    }

    getVehiclesWithinRadius(vehicle: Vehicle, distance: number): Vehicle[] {
        const vLoc = vehicle.location;
        const vId = vehicle.id;
        return this.vehicles.filter((v) => {
            return v.id != vId && (Utils.getLength(vLoc, v.location) <= distance);
        });
    }

    /**
     * compares the paths of nearby vehicles with the passed in `vehicle` and returns an array
     * of other vehicles whose paths intesect with this one's
     * @param vehicle used to calculate a path for detection of vehicles who will cross this path
     * @returns a `Array<Vehicle>` of vehicles whose paths intersect with the passed in `vehicle` path
     */
    getVehiclesWithIntersectingPaths(vehicle: Vehicle, fromVehicles?: Array<Vehicle>): Vehicle[] {
        const intersects = new Array<Vehicle>();
        const dist: number = vehicle.stopDistance;
        const vehicles: Vehicle[] = fromVehicles || this.getVehiclesWithinRadius(vehicle, dist);
        const vehicleHeadingLine = vehicle.stopDistanceIntersectionLine;
        
        for (var i=0; i<vehicles.length; i++) {
            let v: Vehicle = vehicles[i];
            let vHeadingLine = v.stopDistanceIntersectionLine;
            if (Phaser.Geom.Intersects.GetLineToLine(vehicleHeadingLine, vHeadingLine)) {
                intersects.push(v);
            }
        }

        return intersects;
    }

    getVehiclesInView(vehicle: Vehicle): Array<Vehicle> {
        const inView = new Array<Vehicle>();
        const nearbyVehicles = this.getVehiclesWithinRadius(vehicle, vehicle.stopDistance * 1.5);
        const view = vehicle.viewAhead;
        const inViewNearby = nearbyVehicles
            .filter(v => Phaser.Geom.Intersects.GetRectangleToTriangle(v.gameObj.getBounds(), view));
        if (inViewNearby?.length) {
            inView.splice(0, 0, ...inViewNearby);
        }
        return inView;
    }

    update(time: number, delta: number): void {
        this.#roads.forEach(road => road.update(time, delta));
    }

    dispose(): void {
        this.#roads.forEach(road => road.dispose());
    }
}