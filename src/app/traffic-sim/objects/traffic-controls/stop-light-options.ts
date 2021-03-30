import { TfcOptions } from "./tfc-options";

export interface StopLightOptions extends TfcOptions {
    /**
     * number of milliseconds the light remains green
     */
    greenDuration?: number; // 56000 ms
    /**
     * number of milliseconds the light remains yellow
     */
    yellowDuration?: number; // 4000 ms
    /**
     * number of milliseconds the light remains red
     */
    redDuration?: number; // 60000 ms
}