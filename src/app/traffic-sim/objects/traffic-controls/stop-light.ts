import { Vehicle } from "../vehicles/vehicle";
import { TfcState } from "./tfc-state";
import { TfcOptions, TrafficFlowControl } from "./traffic-flow-control";
import { Utils } from "../../helpers/utils";
import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";

export type StopLightOptions = TfcOptions & {
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

export class StopLight extends TrafficFlowControl<Phaser.GameObjects.Ellipse> {
    /**
     * number of milliseconds the light remains green
     */
    readonly greenDuration: number;
    /**
     * number of milliseconds the light remains yellow
     */
    readonly yellowDuration: number;
    /**
     * number of milliseconds the light remains red
     */
    readonly redDuration: number;

    private _gameObj: Phaser.GameObjects.Ellipse;
    #elapsed: number;

    private readonly _scene: Phaser.Scene;
    
    constructor(options: StopLightOptions) {
        super(options);
        this.#elapsed = 0;
        this._scene = this.sim.game.scene.getScene(TrafficSimConstants.UI.Scenes.simulationMap);
        this.greenDuration = (options?.greenDuration === undefined) ? 26000 : options?.greenDuration; // 24 seconds
        this.yellowDuration = (options?.yellowDuration === undefined) ? 4000 : options?.yellowDuration; // 4 seconds
        this.redDuration = (options?.redDuration === undefined) ? 30000 : options?.redDuration; // 30 seconds
    }

    shouldStop(vehicle: Vehicle): boolean {
        if (this.currentState == TfcState.caution || this.currentState == TfcState.stop) {
            return true;
        }
        return false;
    }

    update(time: number, delta: number): void {
        this.#elapsed += delta;
        this._updateState();
        this._setColour();
    }

    override get location(): Phaser.Math.Vector2 {
        return Utils.vector2(this.gameObj.x, this.gameObj.y);
    }

    private _updateState(): void {
        switch (this.currentState) {
            case TfcState.proceed:
                if (this.#elapsed >= this.greenDuration) {
                    this.currentState = TfcState.caution;
                    this.#elapsed -= this.greenDuration;
                }
                break;
            case TfcState.caution:
                if (this.#elapsed >= this.yellowDuration) {
                    this.currentState = TfcState.stop;
                    this.#elapsed -= this.yellowDuration;
                }
                break;
            case TfcState.stop:
                if (this.#elapsed >= this.redDuration) {
                    this.currentState = TfcState.proceed;
                    this.#elapsed -= this.redDuration;
                }
                break;
        }
    }

    private _setColour(): void {
        switch (this.currentState) {
            case TfcState.proceed:
                this.gameObj.fillColor = 0x00ff00; // green
                break;
            case TfcState.caution:
                this.gameObj.fillColor = 0xffff00; // yellow
                break;
            case TfcState.stop:
                this.gameObj.fillColor = 0xff0000; // red
                break;
        }
    }

    get gameObj(): Phaser.GameObjects.Ellipse {
        if (!this._gameObj) {
            this._gameObj = this.scene.add.ellipse(0, 0, this.length, this.width, 0x666666);
            this._gameObj.setOrigin(0.5);
            this._gameObj.setDepth(TrafficSimConstants.UI.Layers.TFCs.Depth);
        }
        return this._gameObj;
    }

    dispose(): void {
        this._scene.children.remove(this.gameObj);
        this.gameObj.destroy();
    }
}