import { TfcOptions } from "./tfc-options";

export interface StopLightOptions extends TfcOptions {
    greenDuration?: number; // 56000 ms
    yellowDuration?: number; // 4000 ms
    redDuration?: number; // 60000 ms
}