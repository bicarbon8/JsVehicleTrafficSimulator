import { GameObj } from "./custom-types";

export interface GameObject<T extends GameObj> {
    readonly gameObj: T;
    readonly scene: Phaser.Scene;
}