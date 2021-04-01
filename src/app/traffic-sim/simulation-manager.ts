import { MapManager } from "./map/map-manager";
import { RoadMap } from "./map/road-map";
import { RoadSegment } from "./map/road-segment";
import { RoadSegmentOptions } from "./map/road-segment-options";
import { StopLight } from "./objects/traffic-controls/stop-light";
import { StopLightOptions } from "./objects/traffic-controls/stop-light-options";
import { TfcOptions } from "./objects/traffic-controls/tfc-options";
import { TrafficFlowControl } from "./objects/traffic-controls/traffic-flow-control";
import { Vehicle } from "./objects/vehicles/vehicle";
import { VehicleGenerator } from "./objects/vehicles/vehicle-generator";
import { VehicleGeneratorOptions } from "./objects/vehicles/vehicle-generator-options";
import { ViewManager } from "./view/view-manager";

export class SimulationManager {
    readonly CRASH_CLEANUP_MAX_DELAY: 300000; // 5 min
    readonly CRASH_CLEANUP_MIN_DELAY: 60000; // 1 min
    
    private _canvasId: string;
    private _startTime: number; // in milliseconds
    private _lastUpdate: number; // millisecond time
    private _realtime: boolean;
    private _isRunning: boolean;
    private _totalElapsedTime: number; // in milliseconds
    /**
     * number of steps between each update; lower values are more accurate, but slower.
     * defaults to 10
     */
    private _timeStep: number;

    private _mapManager: MapManager;
    private _viewMgr: ViewManager;

    constructor(mapMgr?: MapManager, viewMgr?: ViewManager) {
        this._realtime = false;
        this._isRunning = false;
        this._totalElapsedTime = 0;
        this._timeStep = 1000;

        this._mapManager = mapMgr || MapManager.inst;
        this._viewMgr = viewMgr || ViewManager.inst;

        this._lastUpdate = 0;
    }

	init(canvasId: string): void {
        this._canvasId = canvasId;
        this._initObjects();
        this.update();
    }

    reset(): void {
        this._viewMgr.reset();
        this._mapManager.reset();
        this._totalElapsedTime = 0;
        this.init(this._canvasId);
    }

    private _initObjects(): void {
        this._viewMgr.init(this._canvasId);
        this._viewMgr.update();
    }

    isRunning(): boolean {
        return this._isRunning;
    }

    toggleAnimationState(): void {
        if (this.isRunning()) {
            this.stop();
        } else {
            this.start();
        }
    }

    setRealtime(realtime: boolean): void {
        this._realtime = realtime;
    }

    start(): void {
        this._startTime = (this._realtime) ? new Date().getTime() : 0;
        this._isRunning = true;
    }

    stop(): void {
        this._isRunning = false;
        this._lastUpdate = null;
    }

    update(): void {
        if (this._isRunning) {
            let elapsed: number = this.getElapsed();
            this._totalElapsedTime += elapsed;
            this._mapManager.update(elapsed);

            this._lastUpdate = (this._realtime) ? new Date().getTime() : this.getElapsed();
        }
        
        // console.debug(`updating view...`);
        this._viewMgr.update();

        requestAnimationFrame(() => this.update());
    }

    /**
     * provides the number of milliseconds elapsed since last {update}
     * @returns number of milliseconds elapsed
     */
    getElapsed(): number {
        if (this._realtime) {
            let now: number = new Date().getTime();
            if (!this._lastUpdate) {
                this._lastUpdate = this._startTime;
            }
            let elapsed: number = now - this._lastUpdate;
            return elapsed;
        }
        return this.getTimestep();
    }

    setTimestep(timestep: number): void {
        this._timeStep = timestep;
    }

    getTimestep(): number {
        return this._timeStep;
    }

    getTotalElapsed(): number {
        return this._totalElapsedTime;
    }

    getMapManager(): MapManager {
        return this._mapManager;
    }

    getViewManager(): ViewManager {
        return this._viewMgr;
    }

    loadMap(map: RoadMap): void {
        if (map) {
            this.reset();
            // add segments
            for (var i=0; i<map.segments?.length; i++) {
                let opts: RoadSegmentOptions = map.segments[i];
                let s: RoadSegment = new RoadSegment(opts)
                this.getMapManager().addSegment(s);
                this.getViewManager().addRenderable(s);
            }
            // add TFCs
            for (var i=0; i<map.tfcs?.length; i++) {
                let opts: TfcOptions = map.tfcs[i];
                let tfc: TrafficFlowControl;
                switch (opts.type.toLowerCase()) {
                    case 'stoplight':
                        // console.debug(`tfc.startState: ${opts.startState}`);
                        tfc = new StopLight(opts as StopLightOptions);
                        break;
                }
                if (tfc) {
                    let segment: RoadSegment = this.getMapManager().getSegmentsEndingAt(opts.location).find((seg) => {
                        return seg.roadName.toLowerCase() == tfc.roadName.toLowerCase();
                    });
                    if (segment) {
                        segment.addTfc(tfc);
                        this.getViewManager().addRenderable(tfc);
                    }
                }
            }
            // add vehicle generators
            for (var i=0; i<map.generators?.length; i++) {
                let opts: VehicleGeneratorOptions = map.generators[i];
                let g: VehicleGenerator = new VehicleGenerator(opts);
                let segment: RoadSegment = this.getMapManager().getSegmentsStartingAt(opts.location).find((seg) => {
                    return seg.roadName.toLowerCase() == g.roadName.toLowerCase();
                });
                if (segment) {
                    segment.setVehicleGenerator(g);
                }
            }
        }
    }

    removeVehicle(vehicle: Vehicle) {
        this._viewMgr.removeRenderable(vehicle);
        vehicle.getSegment().removeVehicle(vehicle.id);
        vehicle.disposeGeometry();
    }
}

export module SimulationManager {
    export var inst = new SimulationManager();
}