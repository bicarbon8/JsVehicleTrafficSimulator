import { ShouldStopType } from "./should-stop-type";

export interface ShouldStopResponse {
    stop: boolean;
    type?: ShouldStopType;
    id?: number;
    segmentId?: number;
    headingDifference?: number;
}