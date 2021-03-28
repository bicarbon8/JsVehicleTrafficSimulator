import { MapManager } from "./map/map-manager";
import { RoadMap } from "./map/road-map";
import { RoadSegment } from "./map/road-segment";
import { RoadSegmentOptions } from "./map/road-segment-options";
import { StopLight } from "./objects/traffic-controls/stop-light";
import { StopLightOptions } from "./objects/traffic-controls/stop-light-options";
import { TfcOptions } from "./objects/traffic-controls/tfc-options";
import { TrafficFlowControl } from "./objects/traffic-controls/traffic-flow-control";
import { VehicleGenerator } from "./objects/vehicles/vehicle-generator";
import { VehicleGeneratorOptions } from "./objects/vehicles/vehicle-generator-options";
import { ViewManager } from "./view/view-manager";

export class SimulationManager {
    readonly CRASH_CLEANUP_MAX_DELAY: 300000; // 5 min
    readonly CRASH_CLEANUP_MIN_DELAY: 60000; // 1 min
    
    private _canvasId: string;
    private _startTime: number; // in milliseconds
    private _realtime: boolean;
    private _elapsed: number;
    private _keepMoving: boolean;
    private _totalElapsedTime: number; // in milliseconds
    /**
     * number of steps between each update; lower values are more accurate, but slower.
     * defaults to 10
     */
    private _timeStep: number;

    private _mapManager: MapManager;
    private _viewMgr: ViewManager;

    constructor(mapMgr?: MapManager, viewMgr?: ViewManager) {
        this._elapsed = 0;
        this._realtime = false;
        this._keepMoving = false;
        this._totalElapsedTime = 0;
        this._timeStep = 10;

        this._mapManager = mapMgr || MapManager.inst;
        this._viewMgr = viewMgr || ViewManager.inst;
    }

	init(canvasId: string): void {
        this._canvasId = canvasId;
        this._initObjects();
    }

    reset(): void {
        this._viewMgr.reset();
        this._mapManager.reset();
        this._totalElapsedTime = 0;
        this.init(this._canvasId);
    }

    private _initObjects(): void {
        this._viewMgr.init(this._canvasId);
        this._viewMgr.render();
    }

    toggleAnimationState(): void {
        if (this._keepMoving) {
            this.stop();
        } else {
            this.start();
        }
    }

    start(): void {
        this._startTime = new Date().getTime();
        this._keepMoving = true;
        this.move();
    }

    stop(): void {
        this._keepMoving = false;
    }

    move(): void {
        this._elapsed = this.getTimestep();

        // console.debug(`updating map...`);
        this._mapManager.update(this._elapsed);

        // console.debug(`rendering view...`);
        this._viewMgr.render();
        this._totalElapsedTime += this._elapsed;
        // console.debug(`total elapsed ms: '${this._totalElapsedTime}'`);

        if (this._keepMoving) {
            requestAnimationFrame(() => this.move());
        }
    }

    /**
     * provides the number of milliseconds elapsed for calculations
     * of movement
     * @returns number of milliseconds elapsed
     */
    getTimestep(): number {
        return this._timeStep;
    }

    setTimestep(timestep: number): void {
        this._timeStep = timestep;
    }

    getElapsed(): number {
        return this._elapsed;
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
}

export module SimulationManager {
    export var inst = new SimulationManager();
}