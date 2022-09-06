import { V2 } from "./custom-types";

export interface Controllable {
    readonly velocity: V2;
    readonly speed: number;
    lookAt(location: V2): this;
    moveBy(amount: V2): this;
    rotateBy(amount: number): this;
    applyForce(force: V2): this;
}