import { Utils } from "./helpers/utils";
import { MapManager } from "./map/map-manager";
import { RoadMap } from "./map/road-map";
import { RoadSegment, RoadSegmentOptions } from "./map/road-segment";
import { StopLight, StopLightOptions } from "./objects/traffic-controls/stop-light";
import { TfcOptions, TrafficFlowControl } from "./objects/traffic-controls/traffic-flow-control";
import { VehicleGenerator, VehicleGeneratorOptions } from "./objects/vehicles/vehicle-generator";
import { Renderable } from "./view/renderable";
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
    #debug: boolean;

    #mapManager: MapManager;
    #viewMgr: ViewManager;

    constructor(mapMgr?: MapManager, viewMgr?: ViewManager) {
        this._realtime = false;
        this._isRunning = false;
        this._totalElapsedTime = 0;
        this._timeStep = 10;

        this.#mapManager = mapMgr || new MapManager(this);
        this.#viewMgr = viewMgr || ViewManager.inst;

        this._lastUpdate = 0;

        document.addEventListener("visibilitychange", () => this._handleBrowserVisibilityChange(), false);
    }

    get debug(): boolean {
        return this.#debug || false;
    }

    toggleDebugging(): void {
        this.#debug = !this.debug;
    }

	init(canvasId: string): void {
        this._canvasId = canvasId;
        this._initObjects();
    }

    reset(): void {
        this.#viewMgr.reset();
        this.#mapManager.reset();
        this._totalElapsedTime = 0;
        this.init(this._canvasId);
    }

    destroy(): void {
        cancelAnimationFrame(this._frameId);
        this.stop();
        this.#viewMgr.destroy();
        this.#mapManager.destroy();
    }

    private _initObjects(): void {
        this.#viewMgr.init(this._canvasId);
        this.#viewMgr.update();
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

    /**
     * starts the simulation by calling the `update` function
     * within a `requestAnimationFrame` call loop
     */
    start(): void {
        this._startTime = (this._realtime) ? new Date().getTime() : 0;
        this._isRunning = true;
        this.update();
    }

    /**
     * stops the simulation
     */
    stop(): void {
        this._isRunning = false;
        this._lastUpdate = null;
    }

    update(): void {
        if (this._isRunning) {
            let elapsed: number = this.getElapsed();
            this._totalElapsedTime += elapsed;
            this.#mapManager.update(elapsed);

            this._lastUpdate = (this._realtime) ? new Date().getTime() : this.getElapsed();

            this._frameId = requestAnimationFrame(() => this.update());
        }
        
        this.#viewMgr.update();
    }

    /**
     * provides the number of milliseconds elapsed since last {update}
     * @returns number of milliseconds elapsed
     */
    getElapsed(): number {
        if (this._realtime) {
            let now: number = Date.now();
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
        return this.#mapManager;
    }

    getViewManager(): ViewManager {
        return this.#viewMgr;
    }

    /**
     * loads the passed in `RoadMap` adding the required IDs and `MapManager`
     * references to the instantiation options
     * @param map a `RoadMap` JSON object containing details to be loaded
     */
    loadMap(map: RoadMap): void {
        if (map) {
            this.reset();
            // add segments
            for (var i=0; i<map.segments?.length; i++) {
                let opts: Partial<RoadSegmentOptions> = map.segments[i];
                opts.id = Utils.getSegmentId();
                opts.map = this.#mapManager;
                let s: RoadSegment = new RoadSegment(opts as RoadSegmentOptions)
                this.#mapManager.addSegment(s);
                this.getViewManager().addRenderable(s);
            }
            // add TFCs
            for (var i=0; i<map.tfcs?.length; i++) {
                let opts: Partial<TfcOptions> = map.tfcs[i];
                opts.id = Utils.getTfcId();
                opts.map = this.#mapManager;
                let tfc: TrafficFlowControl;
                switch (opts.type.toLowerCase()) {
                    case 'stoplight':
                        tfc = new StopLight(opts as StopLightOptions);
                        break;
                }
                if (tfc) {
                    let segment: RoadSegment = this.#mapManager.getSegmentsEndingAt(opts.location).find((seg) => {
                        return seg.roadName.toLowerCase() == tfc.roadName.toLowerCase();
                    });
                    if (segment) {
                        this.#mapManager.addTfc(tfc, segment, opts.location);
                        this.getViewManager().addRenderable(tfc);
                    }
                }
            }
            // add vehicle generators
            for (var i=0; i<map.generators?.length; i++) {
                let opts: Partial<VehicleGeneratorOptions> = map.generators[i];
                opts.id = Utils.getGeneratorId();
                opts.map = this.#mapManager;
                let g: VehicleGenerator = new VehicleGenerator(opts as VehicleGeneratorOptions);
                let segment: RoadSegment = this.#mapManager.getSegmentsStartingAt(opts.location).find((seg) => {
                    return seg.roadName.toLowerCase() == g.roadName.toLowerCase();
                });
                if (segment) {
                    this.#mapManager.addGenerator(g, segment, opts.location);
                }
            }
        }
    }

    /**
     * adds the passed in object to the `ViewManager` for rendering
     * @param obj object implementing the `Renderable` interface
     * @returns this
     */
    add(obj: Renderable): this {
        this.#viewMgr.addRenderable(obj);
        return this;
    }

    /**
     * removes the passed in object from the `ViewManager` so it
     * is no longer rendered
     * @param obj object implementing the `Renderable` interface
     * @returns this
     */
    remove(obj: Renderable): this {
        this.#viewMgr.removeRenderable(obj);
        return this;
    }

    log(message: string): void {
        if (this.#debug) {
            console.log(message);
        }
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
}