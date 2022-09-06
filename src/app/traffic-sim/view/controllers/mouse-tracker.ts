import { Scene } from "phaser";
import { Utils } from "../../helpers/utils";

export class MouseTracker {
    private _scene: Scene;
    
    constructor(scene: Scene) {
        this._scene = scene;
    }

    get angle(): number {
        return this._pointer()?.getAngle() || 0;
    }

    get rotation(): number {
        return this.angle * (Math.PI / 180);
    }

    get heading(): Phaser.Math.Vector2 {
        let rotation: number = this.angle;
        let x: number = Math.cos(rotation);
        let y: number = Math.sin(rotation);
        return new Phaser.Math.Vector2(x, y).normalize().negate();
    }

    get speed(): number {
        return this.velocity.length();
    }

    get velocity(): Phaser.Math.Vector2 {
        return this._pointer()?.velocity?.clone() || Utils.vector2();
    }

    /**
     * returns the position of the mouse within the bounds of the current
     * screen.
     * @returns a {Vector2} clone of the position
     */
    get locationInView(): Phaser.Math.Vector2 {
        // console.log(`mouse location: ${JSON.stringify(this.location)}`);
        return this._pointer()?.position?.clone() || Utils.vector2();
    }

    /**
     * offsets the screen position based on camera position
     */
    get location(): Phaser.Math.Vector2 {
        // console.log(`mouse REAL location: ${JSON.stringify(world)}`);
        return this._pointer()?.positionToCamera(this._scene?.cameras?.main) as Phaser.Math.Vector2;
    }

    private _pointer(): Phaser.Input.Pointer {
        return this._scene?.input?.activePointer;
    }
}