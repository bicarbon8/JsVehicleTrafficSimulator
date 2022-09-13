import { TrafficSimConstants } from "../helpers/traffic-sim-constants";
import { Utils } from "../helpers/utils";
import { V2 } from "../interfaces/custom-types";
import { SimObj, SimObjOptions } from "../objects/sim-obj";
import { Lane, LaneOptions } from "./lane";
import { LaneSegment } from "./lane-segment";
import { RoadMap } from "./roadmap";

export type RoadOptions = SimObjOptions & {
    roadMap?: RoadMap;
    lanes?: Array<LaneOptions>;
};

export class Road extends SimObj {
    readonly roadMap: RoadMap;

    #lanes: Map<string, Lane>;

    constructor(options: RoadOptions) {
        super(options);
        this.roadMap = options.roadMap;

        this.#lanes = new Map<string, Lane>();
        options.lanes?.forEach(lane => this.addLane(lane));
    }

    addLane(laneOpts: LaneOptions): this {
        laneOpts.road = this;
        laneOpts.simulation = this.sim;
        const lane = new Lane(laneOpts);
        this.#lanes.set(lane.id, lane);
        return this;
    }

    removeLane(id: string): this {
        if (this.#lanes.has(id)) {
            const lane = this.#lanes.get(id);
            lane.dispose();
            this.#lanes.delete(id);
        }
        return this;
    }

    get lanes(): Array<Lane> {
        return Array.from(this.#lanes.values());
    }

    getLane(id: string): Lane {
        return this.#lanes.get(id);
    }

    getNextLanes(currentLaneOrId: Lane | string): Array<Lane> {
        let lane: Lane;
        if (typeof currentLaneOrId === "string") {
            lane = this.#lanes.get(currentLaneOrId);
        } else {
            lane = currentLaneOrId;
        }
        return this.lanes.filter(l => Utils.isWithinDistance(lane.end, l.start, 0.1));
    }

    getLaneSegment(id: string): LaneSegment {
        return this.lanes.find(l => l.getSegmentById(id) != null).getSegmentById(id);
    }

    getSimilarSegments(segment: LaneSegment): Array<LaneSegment> {
        const similar = new Array<LaneSegment>();
        const angle = Utils.rad2deg(segment.rotation);
        this.lanes.forEach(lane => {
            if (lane.id != segment.lane.id) {
                let segments = lane.segments
                    .filter(seg => segment.id != seg.id) // exclude passed in segment
                    .filter(seg => Utils.isBetween(angle - 0.5, angle + 0.5, Utils.rad2deg(seg.rotation))) // segments with similar angle
                    .filter(seg => seg.getMinimumDistanceTo(segment) < 5);
                if (segments?.length) {
                    similar.splice(0, 0, ...segments);
                }
            }
        });
        return similar;
    }

    get starts(): Array<V2> {
        const startPoints = new Array<V2>();
        this.lanes.forEach(lane => {
            startPoints.push(lane.start);
        });
        return startPoints;
    }

    get ends(): Array<V2> {
        const endPoints = new Array<V2>();
        this.lanes.forEach(lane => {
            endPoints.push(lane.end);
        });
        return endPoints;
    }

    update(time: number, delta: number): void {
        this.#lanes.forEach(lane => lane.update(time, delta));
    }

    dispose(): void {
        this.#lanes.forEach(lane => lane.dispose());
    }
}