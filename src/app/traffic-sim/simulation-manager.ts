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
    private _realtime: boolean;
    private _updateMap: boolean;
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
        this._updateMap = false;
        this._totalElapsedTime = 0;
        this._timeStep = 10;

        this._mapManager = mapMgr || MapManager.inst;
        this._viewMgr = viewMgr || ViewManager.inst;
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

    toggleAnimationState(): void {
        if (this._updateMap) {
            this.stop();
        } else {
            this.start();
        }
    }

    start(): void {
        this._startTime = new Date().getTime();
        this._updateMap = true;
    }

    stop(): void {
        this._updateMap = false;
    }

    update(): void {
        let elapsed: number = this.getElapsed();
        this._totalElapsedTime += elapsed;
        // console.debug(`elapsed: '${elapsed}'; total elapsed: '${this._totalElapsedTime}'`);
        
        if (this._updateMap) {
            // console.debug(`updating map...`);
            this._mapManager.update(elapsed);
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
            return now - this.getTotalElapsed();
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
            // add segments
            for (var i=0; i<map.segments.length; i++) {
                let opts: RoadSegmentOptions = map.segments[i];
                let s: RoadSegment = new RoadSegment(opts)
                this.getMapManager().addSegment(s);
                this.getViewManager().addRenderable(s);
            }
            // add TFCs
            for (var i=0; i<map.tfcs.length; i++) {
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
                        return seg.name.toLowerCase() == tfc.roadName.toLowerCase();
                    });
                    if (segment) {
                        segment.addTfc(tfc);
                        this.getViewManager().addRenderable(tfc);
                    }
                }
            }
            // add vehicle generators
            for (var i=0; i<map.generators.length; i++) {
                let opts: VehicleGeneratorOptions = map.generators[i];
                let g: VehicleGenerator = new VehicleGenerator(opts);
                let segment: RoadSegment = this.getMapManager().getSegmentsStartingAt(opts.location).find((seg) => {
                    return seg.name.toLowerCase() == g.roadName.toLowerCase();
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