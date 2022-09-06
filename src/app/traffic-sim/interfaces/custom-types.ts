export type V2 = {
    x: number;
    y: number;
}

export type V3 = V2 & {
    z: number;
}

export type GameObj = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;