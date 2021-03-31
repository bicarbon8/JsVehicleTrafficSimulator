import { TfcOptions } from "../objects/traffic-controls/tfc-options";
import { VehicleGeneratorOptions } from "../objects/vehicles/vehicle-generator-options";
import { RoadSegmentOptions } from "./road-segment-options";

export interface RoadMap {
    segments?: RoadSegmentOptions[];
    tfcs?: TfcOptions[];
    generators?: VehicleGeneratorOptions[];
}