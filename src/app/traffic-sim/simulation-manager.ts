import { MapManager } from "./map/map-manager";
import { RoadMap } from "./map/road-map";
import { RoadSegment, RoadSegmentOptions } from "./map/road-segment";
import { StopLight } from "./objects/traffic-controls/stop-light";
import { TfcOptions, TrafficFlowControl } from "./objects/traffic-controls/traffic-flow-control";
import { Vehicle } from "./objects/vehicles/vehicle";
import { VehicleDecisionEngine } from "./objects/vehicles/vehicle-decision-engine";
import { VehicleGenerator, VehicleGeneratorOptions } from "./objects/vehicles/vehicle-generator";
import { PhysicsManager } from "./physics-manager";
import { ViewManager } from "./view/view-manager";

export class SimulationManager {
    private _canvasId: string;
    private _startTime: number; // in milliseconds
    private _lastUpdate: number; // millisecond time
    private _realtime: boolean;
    private _isRunning: boolean;
    private _previousState: boolean;
    private _totalElapsedTime: number; // in milliseconds
    /**
     * number of steps between each update; lower values are more accurate, but slower.
     * defaults to 10
     */
    private _timeStep: number;
    private _frameId: number;

    private _mapManager: MapManager;
    private _viewMgr: ViewManager;
    private _physicsMgr: PhysicsManager;
    private _decisionEng: VehicleDecisionEngine;

    public debug: boolean = false;

    constructor(mapMgr?: MapManager, viewMgr?: ViewManager, physicsMgr?: PhysicsManager, decisionEng?: VehicleDecisionEngine) {
        this._realtime = false;
        this._isRunning = false;
        this._totalElapsedTime = 0;
        this._timeStep = 10;

        this._mapManager = mapMgr ?? new MapManager();
        this._viewMgr = viewMgr ?? new ViewManager();
        this._physicsMgr = physicsMgr ?? new PhysicsManager();
        this._decisionEng = decisionEng ?? new VehicleDecisionEngine();

        this._lastUpdate = 0;

        document.addEventListener("visibilitychange", () => this._handleBrowserVisibilityChange(), false);
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

    destroy(): void {
        cancelAnimationFrame(this._frameId);
        this.stop();
        this._viewMgr.destroy();
        this._mapManager.destroy();
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
        this._lastUpdate = this._startTime;
        this._isRunning = true;
        this.animationLoop();
    }

    stop(): void {
        this._isRunning = false;
    }

    animationLoop(): void {
        if (this._isRunning) {
            let elapsed: number = this.getElapsed();
            this._totalElapsedTime += elapsed;
            this.update(elapsed);
            this._lastUpdate = (this._realtime) ? new Date().getTime() : this.getElapsed();
            this._frameId = requestAnimationFrame(() => this.animationLoop());
        }
        
        // console.debug(`updating view...`);
        this._viewMgr.update();
    }

    /**
     * progresses the simulation forward by the specified amount of `elapsed` time
     * in milliseconds.
     * 
     * > NOTE: this should be called by the `animationLoop`
     * @param elapsed the amount of time in milliseconds that has elapsed
     */
    update(elapsed: number): void {
        this._mapManager.update(elapsed);
        this._physicsMgr.update(elapsed);
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
        return this.timestep;
    }

    set timestep(step: number) {
        this._timeStep = step;
    }

    get timestep(): number {
        return this._timeStep;
    }

    get totalElapsed(): number {
        return this._totalElapsedTime;
    }

    get mapManager(): MapManager {
        return this._mapManager;
    }

    get viewManager(): ViewManager {
        return this._viewMgr;
    }

    get physicsManager(): PhysicsManager {
        return this._physicsMgr;
    }

    get decisionEng(): VehicleDecisionEngine {
        return this._decisionEng;
    }

    loadMap(map: RoadMap): void {
        if (map) {
            this.reset();
            // add segments
            for (var i=0; i<map.segments?.length; i++) {
                let opts: RoadSegmentOptions = map.segments[i];
                let s: RoadSegment = new RoadSegment(opts)
                this.mapManager.addSegment(s);
                this.viewManager.addRenderable(s);
            }
            // add TFCs
            for (var i=0; i<map.tfcs?.length; i++) {
                let opts: TfcOptions = map.tfcs[i];
                let tfc: TrafficFlowControl;
                switch (opts.type.toLowerCase()) {
                    case 'stoplight':
                        // console.debug(`tfc.startState: ${opts.startState}`);
                        tfc = new StopLight(opts);
                        break;
                }
                if (tfc) {
                    let segment: RoadSegment = this.mapManager.getSegmentsEndingAt(opts.location).find((seg) => {
                        return seg.roadName.toLowerCase() == tfc.roadName.toLowerCase();
                    });
                    if (segment) {
                        segment.addTrafficFlowControl(tfc);
                        this.viewManager.addRenderable(tfc);
                    }
                }
            }
            // add vehicle generators
            for (var i=0; i<map.generators?.length; i++) {
                let opts: VehicleGeneratorOptions = map.generators[i];
                let g: VehicleGenerator = new VehicleGenerator(opts);
                let segment: RoadSegment = this.mapManager.getSegmentsStartingAt(opts.location).find((seg) => {
                    return seg.roadName.toLowerCase() == g.roadName.toLowerCase();
                });
                if (segment) {
                    segment.vehicleGenerator = g;
                }
            }
        }
    }

    removeVehicle(vehicle: Vehicle) {
        this._viewMgr.removeRenderable(vehicle);
        vehicle.segment?.removeVehicle(vehicle.id);
        vehicle.disposeGeometry();
    }

    private _handleBrowserVisibilityChange() {
        if (document.visibilityState == 'hidden') {
            if (this.isRunning()) {
                this._previousState = true;
                this.stop();
            }
        } 
        if (document.visibilityState == 'visible') {
            if (this._previousState) {
                this._previousState = false;
                this.start();
            }
        }
    }
}

export module SimulationManager {
    export var inst = new SimulationManager();
    export var Constants = Object.freeze({
        CRASH_CLEANUP_MAX_DELAY: 300000, // 5 min
        CRASH_CLEANUP_MIN_DELAY: 60000,  // 1 min
    })
}