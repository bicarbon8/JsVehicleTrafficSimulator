import { Mesh, SphereGeometry, MeshBasicMaterial, Object3D } from "three";
import { SimulationManager } from "../../simulation-manager";
import { Vehicle } from "../vehicles/vehicle";
import { StopLightOptions } from "./stop-light-options";
import { TfcOptions } from "./tfc-options";
import { TfcState } from "./tfc-state";
import { TrafficFlowControl } from "./traffic-flow-control";

export class StopLight extends TrafficFlowControl {
    private readonly _greenDuration: number;
    private readonly _yellowDuration: number;
    private readonly _redDuration: number;
    
    constructor(options?: StopLightOptions, simMgr?: SimulationManager) {
        super(options as TfcOptions, simMgr);
        this._greenDuration = (options?.greenDuration === undefined) ? 26000 : options?.greenDuration; // 24 seconds
        this._yellowDuration = (options?.yellowDuration === undefined) ? 4000 : options?.yellowDuration; // 4 seconds
        this._redDuration = (options?.redDuration === undefined) ? 30000 : options?.redDuration; // 30 seconds
    }

    shouldStop(vehicle: Vehicle): boolean {
        if (this.currentState == TfcState.caution || this.currentState == TfcState.stop) {
            return true;
        }
        return false;
    }
    
    protected generateMesh(): Object3D {
        // z coordinate used for vertical height
        var geometry = new SphereGeometry(1);
        var material = new MeshBasicMaterial({
            color: 0xffffff // white
        });
        return new Mesh(geometry, material);
    }

    update(elapsedMs?: number): void {
        this.elapsed += elapsedMs;
        this._updateState();
        this._setColour();
    }

    private _updateState(): void {
        switch (this.currentState) {
            case TfcState.proceed:
                if (this.elapsed >= this._greenDuration) {
                    this.currentState = TfcState.caution;
                    this.elapsed = 0;
                }
                break;
            case TfcState.caution:
                if (this.elapsed >= this._yellowDuration) {
                    this.currentState = TfcState.stop;
                    this.elapsed = 0;
                }
                break;
            case TfcState.stop:
                if (this.elapsed >= this._redDuration) {
                    this.currentState = TfcState.proceed;
                    this.elapsed = 0;
                }
                break;
        }
    }

    private _setColour(): void {
        switch (this.currentState) {
            case TfcState.proceed:
                this.getMaterial()?.color.setHex(0x00ff00); // green
                break;
            case TfcState.caution:
                this.getMaterial()?.color.setHex(0xffff00); // yellow
                break;
            case TfcState.stop:
                this.getMaterial()?.color.setHex(0xff0000); // red
                break;
        }
    }
}