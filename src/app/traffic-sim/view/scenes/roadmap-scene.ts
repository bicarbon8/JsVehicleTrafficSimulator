import * as Phaser from "phaser";
import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";
import { Utils } from "../../helpers/utils";
import { ControlManager } from "../controllers/control-manager";
import { KbmControlManager } from "../controllers/kbm-control-manager";
import { TouchControlManager } from "../controllers/touch-control-manager";
import { TrafficSim } from "../traffic-sim";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: true,
    visible: true,
    key: TrafficSimConstants.UI.Scenes.roadmapScene
};

export class RoadmapScene extends Phaser.Scene {
    private _width: number;
    private _height: number;
    private _controller: ControlManager;
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

        this._setupCamera();
        this._createControllers();
        this.game.events.emit(Phaser.Scenes.Events.READY);
    }

    update(time: number, delta: number): void {
        this._controller?.update(time, delta);
        if (TrafficSim.inst.roadMap) {
            TrafficSim.inst.roadMap?.update(time, delta);
        }
        if (TrafficSim.inst.activeVehicle) {
            this.cameras.main.startFollow(TrafficSim.inst.activeVehicle.gameObj, true, 1, 1);
            this.#following = true;
        } else {
            this.cameras.main.stopFollow();
            this.#following = false;
        }
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

    private _playBackgroundMusic(): void {
        this._backgroundMusic = this.sound.add('background-music', {loop: true, volume: 0.1});
        this._backgroundMusic.play();
    }
}