import * as Phaser from "phaser";
import { TrafficSimConstants } from "../helpers/traffic-sim-constants";
import { Utils } from "../helpers/utils";
import { ControlManager } from "./controllers/control-manager";
import { KbmControlManager } from "./controllers/kbm-control-manager";
import { TouchControlManager } from "./controllers/touch-control-manager";
import { TrafficSim } from "./traffic-sim";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: false,
    visible: false,
    key: TrafficSimConstants.UI.Scenes.simulationMap
};

export class ViewScene extends Phaser.Scene {
    private _width: number;
    private _height: number;
    private _controller: ControlManager;
    private _hudText: Phaser.GameObjects.Text;
    private _scoreText: Phaser.GameObjects.Text;
    private _backgroundMusic: Phaser.Sound.BaseSound;

    debug: boolean;
    #following: boolean;

    constructor(settingsConfig?: Phaser.Types.Scenes.SettingsConfig) {
        super(settingsConfig || sceneConfig);

        this.debug = false;
        this.#following = false;
    }

    preload(): void {
        // this.load.audio('background-music', `${environment.baseUrl}/assets/audio/space-marine-theme.ogg`);
    }

    create(): void {
        this._width = this.game.canvas.width;
        this._height = this.game.canvas.height;

        this._createHUD();
        this._setupCamera();
        this._createControllers();
        this.game.events.emit(Phaser.Scenes.Events.READY);
    }

    async update(time: number, delta: number): Promise<void> {
        this._controller?.update(time, delta);
        if (TrafficSim.inst.roadMap) {
            TrafficSim.inst.roadMap?.update(time, delta);
        }
        if (!this.#following && TrafficSim.inst.activeVehicle) {
            this.cameras.main.startFollow(TrafficSim.inst.activeVehicle.gameObj, true, 1, 1);
            this.#following = true;
        }
        if (this.#following && !TrafficSim.inst.activeVehicle) {
            this.cameras.main.stopFollow();
            this.#following = false;
        }
        this._displayHUDInfo();
    }

    private _createHUD(): void {
        this._hudText = this.add.text(10, 10, '', { font: '12px Courier', color: '#ffdddd' });
        this._hudText.setScrollFactor(0); // keep fixed in original location on screen
        this._hudText.setDepth(TrafficSimConstants.UI.Layers.Hud.Depth);
    }

    private _createControllers(): void {
        if (this.game.device.os.desktop) {
            this._controller = new KbmControlManager(this);
        } else {
            this._controller = new TouchControlManager(this);
        }
    }

    private _setupCamera(): void {
        this.cameras.main.backgroundColor.setFromRGB({r: 0, g: 0, b: 0});
        
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(0, 0);
    }

    private _displayHUDInfo(): void {
        try {
            let info: string[] = [];
            if (TrafficSim.inst.activeVehicle) {
                const v = TrafficSim.inst.activeVehicle;
                const loc = v.location;
                const heading = v.heading;
                const velocity = v.velocity;
                info = [
                    `Speed: ${Utils.convertMetresPerSecToKmph(v.speed).toFixed(1)} Km/h`,
                    `Velocity: x:${velocity.x.toFixed(1)}, y:${velocity.y.toFixed(1)} m/s`,
                    `Heading: x:${heading.x.toFixed(1)}, y:${heading.y.toFixed(1)}`,
                    `Stop Dist: ${v.stopDistance.toFixed(1)}`,
                    `Location: x:${loc.x.toFixed(1)}, y:${loc.y.toFixed(1)}`,
                    `Rotation: ${v.rotation.toFixed(1)}, Body: ${v.body.rotation.toFixed(1)}`
                ];
            } else {
                info = [
                    `Vehicles: ${TrafficSim.inst.roadMap.vehicles.length}`,
                    `Roads: ${TrafficSim.inst.roadMap.roads.length}`
                ]
            }
            
            this._hudText.setText(info);
        } catch (e) {
            // do nothing
        }
    }

    private _playBackgroundMusic(): void {
        this._backgroundMusic = this.sound.add('background-music', {loop: true, volume: 0.1});
        this._backgroundMusic.play();
    }
}