import { V2 } from "./custom-types";

export interface Positionable {
    readonly length: number;
    readonly width: number;
    readonly location: V2;
    readonly rotation: number;
    readonly heading: V2;
    setLocation(pos: V2): this;
    setRotation(radians: number): this;
    setHeading(heading: V2): this;
}