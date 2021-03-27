import { MapManager } from "./map/map-manager";
import { ViewManager } from "./view/view-manager";

export class SimulationManager {
    readonly CRASH_CLEANUP_MAX_DELAY: 300000; // 5 min
    readonly CRASH_CLEANUP_MIN_DELAY: 60000; // 1 min
    readonly startTime: number; // in milliseconds
    
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
        this.startTime = new Date().getTime();
        this._elapsed = 0;
        this._realtime = false;
        this._keepMoving = false;
        this._totalElapsedTime = 0;
        this._timeStep = 10;

        this._mapManager = mapMgr || MapManager.inst;
        this._viewMgr = viewMgr || ViewManager.inst;
    }

	init(): void {
        this._initObjects();
    }

    reset(): void {
        this._viewMgr.reset();
        this._mapManager.reset();
        this._totalElapsedTime = 0;
        this.init();
    }

    private _initObjects(): void {
        let canvas: HTMLCanvasElement = document.querySelector('#traffic-sim');
        this._viewMgr.init(canvas);
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
        this._keepMoving = true;
        this.move();
    }

    stop(): void {
        this._keepMoving = false;
    }

    move(): void {
        this._elapsed = this.getTimestep();

        // update segments
        this._mapManager.update(this._elapsed);

        this._viewMgr.render();
        this._totalElapsedTime += this._elapsed;

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
}

export module SimulationManager {
    export var inst = new SimulationManager();
}