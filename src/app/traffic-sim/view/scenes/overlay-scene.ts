import { TrafficSimConstants } from "../../helpers/traffic-sim-constants";
import { Utils } from "../../helpers/utils";
import { TrafficSim } from "../traffic-sim";

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
    active: true,
    visible: true,
    key: TrafficSimConstants.UI.Scenes.overlayScene
};

export class OverlayScene extends Phaser.Scene {
    private _width: number;
    private _height: number;
    private _hudText: Phaser.GameObjects.Text;

    constructor(settingsConfig?: Phaser.Types.Scenes.SettingsConfig) {
        super(settingsConfig || sceneConfig);
    }

    preload(): void {
        
    }

    create(): void {
        this._width = this.game.canvas.width;
        this._height = this.game.canvas.height;

        this._createHUD();
    }

    update(time: number, delta: number): void {
        this._displayHUDInfo();
    }

    private _createHUD(): void {
        this._hudText = this.add.text(10, 10, '', { font: '12px Courier', color: '#ffdddd' });
        this._hudText.setScrollFactor(0); // keep fixed in original location on screen
        this._hudText.setDepth(TrafficSimConstants.UI.Layers.Hud.depth);
    }

    private _displayHUDInfo(): void {
        try {
            let info: string[] = [
                `Elapsed: ${Utils.convertMsToHumanReadable(this.time.now)}`,
                `Vehicles: ${TrafficSim.inst.roadMap.vehicles.length}`,
                `Roads: ${TrafficSim.inst.roadMap.roads.length}`
            ];
            if (TrafficSim.inst.activeVehicle) {
                const v = TrafficSim.inst.activeVehicle;
                const loc = v.location;
                const heading = v.heading;
                const velocity = v.velocity;
                const stopDist = v.stopDistance;
                const vehiclesAhead = v.getVehiclesAhead(stopDist);
                const tfcsAhead = v.getTfcsAhead(stopDist);
                info.splice(info.length, 0, ...[
                    `Speed: ${Utils.convertMetresPerSecToKmph(v.speed).toFixed(1)} Km/h`,
                    `Velocity: x:${velocity.x.toFixed(1)}, y:${velocity.y.toFixed(1)} m/s`,
                    `Heading: x:${heading.x.toFixed(1)}, y:${heading.y.toFixed(1)}`,
                    `Stop Dist: ${v.stopDistance.toFixed(1)}, Acc: ${v.acceleration.toFixed(1)}, Dec: ${v.deceleration.toFixed(1)}`,
                    `Location: x:${loc.x.toFixed(1)}, y:${loc.y.toFixed(1)}`,
                    `Rotation: ${v.rotation.toFixed(1)}, Body: ${v.body.rotation.toFixed(1)}`,
                    `State: ${v.state}, ${(v.state === 'crashed') ? Utils.convertMsToHumanReadable(v.timeUntilCrashCleanup) : ''}`,
                    `Road: ${v.roadMap.name}, ${v.road.name}, ${v.lane.name}, ${v.segment.name}`,
                    `Vehicles ahead: ${vehiclesAhead?.length || 0}`,
                    `TFCs ahead: ${tfcsAhead?.length || 0}, states: [${tfcsAhead.map(tfc => tfc.currentState).join(',')}]`
                ]);
            }
            if (TrafficSim.inst.activeSegment) {
                const s = TrafficSim.inst.activeSegment;
                info.splice(info.length, 0, ...[
                    `LaneSegment: ${s.name}, SpeedLimit: ${s.speedLimit}`,
                    `Lane: ${s.lane.name}`,
                    `Road: ${s.road.name}`
                ]);
            }
            
            this._hudText.setText(info);
        } catch (e) {
            // do nothing
        }
    }
}