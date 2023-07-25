import { Mesh, SphereGeometry, Object3D, Group } from "three";
import { SimulationManager } from "../../simulation-manager";
import { Vehicle } from "../vehicles/vehicle";
import { TfcOptions, TrafficFlowControl } from "./traffic-flow-control";

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

export class StopLight extends TrafficFlowControl {
    /**
     * number of milliseconds the light remains green
     */
    private readonly _greenDuration: number;
    /**
     * number of milliseconds the light remains yellow
     */
    private readonly _yellowDuration: number;
    /**
     * number of milliseconds the light remains red
     */
    private readonly _redDuration: number;
    
    constructor(options?: StopLightOptions, simMgr?: SimulationManager) {
        super(options as TfcOptions, simMgr);
        this._greenDuration = (options?.greenDuration === undefined) ? 26000 : options?.greenDuration; // 24 seconds
        this._yellowDuration = (options?.yellowDuration === undefined) ? 4000 : options?.yellowDuration; // 4 seconds
        this._redDuration = (options?.redDuration === undefined) ? 30000 : options?.redDuration; // 30 seconds
    }

    shouldStop(vehicle: Vehicle): boolean {
        if (this.state == 'caution' || this.state == 'stop') {
            return true;
        }
        return false;
    }
    
    protected generateObj3D(): Object3D {
        const group = new Group();
        var geometry = new SphereGeometry(1);
        const mesh = new Mesh(geometry, this.material);
        mesh.translateY(4);
        group.add(mesh);
        return group;
    }

    override update(elapsedMs?: number): void {
        super.update(elapsedMs);
        this._updateState();
        this._setColour();
    }

    private _updateState(): void {
        switch (this.state) {
            case 'proceed':
                if (this.elapsed >= this._greenDuration) {
                    this.setState('caution');
                    this.resetElapsed();
                }
                break;
            case 'caution':
                if (this.elapsed >= this._yellowDuration) {
                    this.setState('stop');
                    this.resetElapsed();
                }
                break;
            case 'stop':
                if (this.elapsed >= this._redDuration) {
                    this.setState('proceed');
                    this.resetElapsed();
                }
                break;
        }
    }

    private _setColour(): void {
        switch (this.state) {
            case 'proceed':
                this.material?.color.setHex(0x00ff00); // green
                this.material?.emissive.setHex(0x00ff00);
                break;
            case 'caution':
                this.material?.color.setHex(0xffff00); // yellow
                this.material?.emissive.setHex(0xffff00);
                break;
            case 'stop':
                this.material?.color.setHex(0xff0000); // red
                this.material?.emissive.setHex(0xff0000);
                break;
            default:
                console.error('invalid TfcState of', this.state, 'for id', this.id);
                break;
        }
    }
}