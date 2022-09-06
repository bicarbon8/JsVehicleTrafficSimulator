import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";
import { Controllable } from "../../interfaces/controllable";
import { ViewScene } from "../view-scene";
import { ControlManager } from "./control-manager";

export class KbmControlManager extends ControlManager {
    private _cameraUpKey: Phaser.Input.Keyboard.Key;
    private _cameraDownKey: Phaser.Input.Keyboard.Key;
    private _cameraLeftKey: Phaser.Input.Keyboard.Key;
    private _cameraRightKey: Phaser.Input.Keyboard.Key;
    
    constructor(scene: ViewScene, ...controllables: Array<Controllable>) {
        super(scene, ...controllables);

        this._setupMouseBindings();
        this._setupKeyBindings();
    }

    async update(time: number, delta: number): Promise<void> {
        if (this.active) {
            this._handleCameraScroll();
        }
    }

    private _setupMouseBindings(): void {
        // Zoom Camera
        this.scene.input.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number, deltaZ: number) => {
            // this.emit(WarGame.EVENTS.CAMERA_ZOOM, deltaZ * -0.001);
            const zoom: number = this.scene.cameras.main.zoom;
            let newZoom: number = zoom + (deltaZ * -0.001);
            if (newZoom > TrafficSimConstants.UI.Camera.Zoom.max) { newZoom = TrafficSimConstants.UI.Camera.Zoom.max; }
            if (newZoom < TrafficSimConstants.UI.Camera.Zoom.min) { newZoom = TrafficSimConstants.UI.Camera.Zoom.min; }
            this.scene.cameras.main.setZoom(newZoom);
        }, this);
    }

    private _setupKeyBindings(): void {
        this._cameraUpKey = this.scene.input.keyboard.addKey('W', true, true);
        this._cameraUpKey.on(Phaser.Input.Keyboard.Events.DOWN, () => {
            // this.emit(WarGame.EVENTS.CAMERA_MOVE_START);
        }, this).on(Phaser.Input.Keyboard.Events.UP, () => {
            if (!this._cameraUpKey.isDown && !this._cameraDownKey.isDown && !this._cameraLeftKey.isDown && !this._cameraRightKey.isDown) {
                // this.emit(WarGame.EVENTS.CAMERA_MOVE_END);
            }
        });
        this._cameraDownKey = this.scene.input.keyboard.addKey('S', true, true);
        this._cameraDownKey.on(Phaser.Input.Keyboard.Events.DOWN, () => {
            // this.emit(WarGame.EVENTS.CAMERA_MOVE_START);
        }, this).on(Phaser.Input.Keyboard.Events.UP, () => {
            if (!this._cameraUpKey.isDown && !this._cameraDownKey.isDown && !this._cameraLeftKey.isDown && !this._cameraRightKey.isDown) {
                // this.emit(WarGame.EVENTS.CAMERA_MOVE_END);
            }
        });
        this._cameraLeftKey = this.scene.input.keyboard.addKey('A', true, true);
        this._cameraLeftKey.on(Phaser.Input.Keyboard.Events.DOWN, () => {
            // this.emit(WarGame.EVENTS.CAMERA_MOVE_START);
        }, this).on(Phaser.Input.Keyboard.Events.UP, () => {
            if (!this._cameraUpKey.isDown && !this._cameraDownKey.isDown && !this._cameraLeftKey.isDown && !this._cameraRightKey.isDown) {
                // this.emit(WarGame.EVENTS.CAMERA_MOVE_END);
            }
        });
        this._cameraRightKey = this.scene.input.keyboard.addKey('D', true, true);
        this._cameraRightKey.on(Phaser.Input.Keyboard.Events.DOWN, () => {
            // this.emit(WarGame.EVENTS.CAMERA_MOVE_START);
        }, this).on(Phaser.Input.Keyboard.Events.UP, () => {
            if (!this._cameraUpKey.isDown && !this._cameraDownKey.isDown && !this._cameraLeftKey.isDown && !this._cameraRightKey.isDown) {
                // this.emit(WarGame.EVENTS.CAMERA_MOVE_END);
            }
        });

        this.scene.input.keyboard.enableGlobalCapture();
    }

    private _handleCameraScroll(): void {
        const zoom: number = this.scene.cameras.main.zoom;
        if (this._cameraLeftKey.isDown) {
            this.scene.cameras.main.scrollX -= TrafficSimConstants.UI.Camera.scrollSpeed / zoom;
        }
        if (this._cameraRightKey.isDown) {
            this.scene.cameras.main.scrollX += TrafficSimConstants.UI.Camera.scrollSpeed / zoom;
        }
        if (this._cameraUpKey.isDown) {
            this.scene.cameras.main.scrollY -= TrafficSimConstants.UI.Camera.scrollSpeed / zoom;
        }
        if (this._cameraDownKey.isDown) {
            this.scene.cameras.main.scrollY += TrafficSimConstants.UI.Camera.scrollSpeed / zoom;
        }
    }
}