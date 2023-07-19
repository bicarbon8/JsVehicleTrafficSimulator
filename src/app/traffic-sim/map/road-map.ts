import { TfcOptions } from "../objects/traffic-controls/traffic-flow-control";
import { VehicleGeneratorOptions } from "../objects/vehicles/vehicle-generator";
import { RoadSegmentOptions } from "./road-segment";

export interface RoadMap {
    segments?: RoadSegmentOptions[];
    tfcs?: TfcOptions[];
    generators?: VehicleGeneratorOptions[];
}