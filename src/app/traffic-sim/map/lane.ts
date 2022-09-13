import { Utils } from "../helpers/utils";
import { V2 } from "../interfaces/custom-types";
import { SimObj, SimObjOptions } from "../objects/sim-obj";
import { LaneSegment, LaneSegmentOptions } from "./lane-segment";
import { Road } from "./road";
import { RoadMap } from "./roadmap";

export type LaneOptions = SimObjOptions & {
    road?: Road;
    segments?: Array<LaneSegmentOptions>;
};

export class Lane extends SimObj {
    readonly road: Road;

    #segments: Map<string, LaneSegment>;
    #start: V2;
    #end: V2;

    constructor(options: LaneOptions) {
        super(options);
        this.road = options.road;

        this.#segments = new Map<string, LaneSegment>();
        options.segments?.forEach(seg => this.addSegment(seg));
    }

    get roadMap(): RoadMap {
        return this.road.roadMap;
    }

    addSegment(segmentOpts: LaneSegmentOptions): LaneSegment {
        segmentOpts.lane = this;
        segmentOpts.simulation = this.sim;
        const segment = new LaneSegment(segmentOpts);
        segment.gameObj;
        this.#segments.set(segment.id, segment);
        if (!this.#start) {
            this.#start = segment.start;
        }
        this.#end = segment.end;
        return segment;
    }

    get start(): V2 {
        return this.#start;
    }

    get end(): V2 {
        return this.#end;
    }

    isLoop(): boolean {
        return Utils.isWithinDistance(this.start, this.end, 0.1);
    }

    get segments(): Array<LaneSegment> {
        return Array.from(this.#segments.values());
    }

    getSegmentById(id: string): LaneSegment {
        return this.#segments.get(id);
    }

    getNextSegments(idOrSegment: string | LaneSegment): Array<LaneSegment> {
        let current: LaneSegment;
        if (typeof idOrSegment === "string") {
            current = this.#segments.get(idOrSegment);
        } else {
            current = idOrSegment;
        }
        const nextSegments = new Array<LaneSegment>();
        // search in this `RoadMap`
        this.roadMap.roads.forEach((road) => {
            road.lanes.forEach((lane) => {
                let segments = lane.segments.filter(seg => Utils.isWithinDistance(current.end, seg.start, 0.1));
                if (segments?.length) {
                    nextSegments.splice(0, 0, ...segments);
                }
            });
        });
        return nextSegments;
    }

    update(time: number, delta: number): void {
        this.#segments.forEach(seg => seg.update(time, delta));
    }

    dispose(): void {
        this.#segments.forEach(seg => seg.dispose());
    }
}