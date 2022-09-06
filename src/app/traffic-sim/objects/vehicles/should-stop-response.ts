import { ShouldStopType } from "./should-stop-type";

export interface ShouldStopResponse {
    stop: boolean;
    type?: ShouldStopType;
    id?: string;
    segmentId?: string;
    headingDifference?: number;
}