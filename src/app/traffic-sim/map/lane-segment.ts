import * as Phaser from "phaser";
import { TrafficSimConstants } from "../helpers/traffic-sim-constants";
import { Utils } from '../helpers/utils';
import { V2 } from "../interfaces/custom-types";
import { PositionableSimObj, PositionableSimObjOptions } from "../objects/positionable-sim-obj";
import { StopLight } from "../objects/traffic-controls/stop-light";
import { TfcOptions, TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator, VehicleGeneratorOptions } from '../objects/vehicles/vehicle-generator';
import { Lane } from "./lane";
import { Road } from "./road";
import { RoadMap } from "./road-map";

export type LaneSegmentOptions = PositionableSimObjOptions & {
    start: Phaser.Math.Vector2;
    end: Phaser.Math.Vector2;
    /**
     * width of `LaneSegment` in Metres
     */
    width?: number;
    /**
     * maximum legal speed allowed on `LaneSegment` in Kilometres per Hour
     */
    speedLimit?: number;
    /**
     * indicates that this `LaneSegment` merges with other traffic so the
     * collision detection should look across a wider range
     */
    isInlet?: boolean;
    lane?: Lane;
    tfcs?: Array<TfcOptions>;
    generators?: Array<VehicleGeneratorOptions>;
};

export class LaneSegment extends PositionableSimObj<Phaser.GameObjects.Line> {
    readonly lane: Lane;
    /**
     * name of the road to which this `LaneSegment` belongs. this
     * is used in determining which lanes are available for change
     * lane manouvres
     */
    readonly roadName: string;
    /**
     * width of `LaneSegment` in Metres
     */
    readonly width: number;
    /**
     * indicates that this `LaneSegment` merges with other traffic so the
     * collision detection should look across a wider range
     */
    readonly isInlet: boolean;
    readonly start: V2;
    readonly midpoint: V2;
    readonly end: V2;
    readonly speedLimit: number;

    #vehicles: Map<string, Vehicle>;
    #tfcs: Map<string, TrafficFlowControl<any>>;
    #generators: Map<string, VehicleGenerator>;

    #line: Phaser.Geom.Line;
    #laneChangeLocations: Array<Phaser.Math.Vector2>;
    #gameObj: Phaser.GameObjects.Line;

    constructor(options: LaneSegmentOptions) {
        super(options);
        this.lane = options.lane;

        this.speedLimit = (options?.speedLimit == null) ? Infinity : options.speedLimit;
        options.start ??= Utils.vector2();
        options.end ??= Utils.vector2();
        this.#line = new Phaser.Geom.Line(options.start.x, options.start.y, options.end.x, options.end.y);
        this.width = options?.width || 5;
        this.isInlet = options?.isInlet || false;
        this.#laneChangeLocations = new Array<Phaser.Math.Vector2>();

        this._generateLaneChangePoints();

        this.start = this.#line.getPointA();
        const point = this.#line.getPoint(0.5);
        this.midpoint = Utils.vector2(point.x, point.y);
        this.end = this.#line.getPointB();

        this.#vehicles = new Map<string, Vehicle>();
        this.#tfcs = new Map<string, TrafficFlowControl<any>>();
        this.#generators = new Map<string, VehicleGenerator>();
        options.tfcs?.forEach(tfcOpts => this.addTfc(tfcOpts));
        options.generators?.forEach(genOpts => this.addGenerator(genOpts));
    }

    override get rotation(): number {
        return Phaser.Math.Angle.BetweenPoints(this.start, this.end);
    }

    get nextSegments(): Array<LaneSegment> {
        return this.lane.getNextSegments(this);
    }

    get road(): Road {
        return this.lane.road;
    }

    get roadMap(): RoadMap {
        return this.road.roadMap;
    }

    update(time: number, delta: number): void {
        this.#tfcs.forEach(tfc => tfc?.update(time, delta));
        this.#vehicles.forEach(v => v?.update(time, delta));
        this.#generators.forEach(gen => gen?.update(time, delta));
    }
    
    getLaneChangePoints(): Phaser.Math.Vector2[] {
        return this.#laneChangeLocations;
    }

    addVehicle(vehicle: Vehicle, location?: V2): this {
        vehicle.setSegment(this, location);
        this.#vehicles.set(vehicle.id, vehicle);
        return this;
    }

    get vehicles(): Array<Vehicle> {
        return Array.from(this.#vehicles.values());
    }

    removeVehicle(vehicleOrId: Vehicle | string): this {
        let v: Vehicle;
        if (typeof vehicleOrId === "string") {
            v = this.#vehicles.get(vehicleOrId);
        } else {
            v = vehicleOrId;
        }
        if (v) {
            this.#vehicles.delete(v.id);
        }
        return this;
    }

    addTfc(tfcOpts: TfcOptions): this {
        tfcOpts.simulation = this.sim;
        tfcOpts.laneSegment = this;
        let tfc: TrafficFlowControl<any>;
        switch (tfcOpts.type) {
            case 'stoplight':
                tfc = new StopLight(tfcOpts);
                break;
        }
        this.#tfcs.set(tfc.id, tfc);
        return this;
    }

    get tfcs(): Array<TrafficFlowControl<any>> {
        return Array.from(this.#tfcs.values());
    }

    removeTfc(tfcOrId: TrafficFlowControl<any> | string): this {
        let tfc: TrafficFlowControl<any>;
        if (typeof tfcOrId === "string") {
            tfc = this.#tfcs.get(tfcOrId);
        } else {
            tfc = tfcOrId;
        }
        if (tfc) {
            this.#tfcs.delete(tfc.id);
        }
        return this;
    }

    addGenerator(genOpts: VehicleGeneratorOptions): this {
        genOpts.simulation = this.sim;
        genOpts.laneSegment = this;
        const generator = new VehicleGenerator(genOpts);
        generator.laneSegment = this;
        this.#generators.set(generator.id, generator);
        return this;
    }

    get generators(): Array<VehicleGenerator> {
        return Array.from(this.#generators.values());
    }

    removeGenerator(generatorOrId: VehicleGenerator | string): this {
        let gen: VehicleGenerator;
        if (typeof generatorOrId === "string") {
            gen = this.#generators.get(generatorOrId);
        } else {
            gen = generatorOrId;
        }
        if (gen) {
            this.#generators.delete(gen.id);
        }
        return this;
    }

    private _generateLaneChangePoints(): void {
        // place point every [spacing] units (metres)
        var spacing = 1;
        const points: Array<Phaser.Geom.Point> = this.line.getPoints(0, spacing);
        this.#laneChangeLocations = points.map(p => Utils.vector2(p.x, p.y));
    }

    get line(): Phaser.Geom.Line {
        return this.#line;
    }

    getTangent(): V2 {
        let s = new Phaser.Curves.Line(Utils.vector2(this.start), Utils.vector2(this.end));
        return s.getTangent(0.5);
    }

    getMinimumDistanceTo(segment: LaneSegment): number {
        let distance = Infinity;
        if (segment) {
            const points = this.getLaneChangePoints();
            const segPoints = segment.getLaneChangePoints();
            for (var i=0; i<points.length; i++) {
                let point = points[i];
                for (var j=0; j<segPoints.length; j++) {
                    let segPoint = segPoints[j];
                    let dist = Utils.getLength(point, segPoint);
                    if (dist < distance) {
                        distance = dist;
                    }
                }
            }
        }
        return distance;
    }

    get gameObj(): Phaser.GameObjects.Line {
        if (!this.#gameObj) {
            this.#gameObj = this.scene.add.line(0, 0, this.start.x, this.start.y, this.end.x, this.end.y, 0x0066ff);
            this.#gameObj.setOrigin(0, 0);
            this.scene.add.circle(this.start.x, this.start.y, this.width, 0x00ff00);
        }
        return this.#gameObj;
    }
    get scene(): Phaser.Scene {
        return this.sim.game.scene.getScene(TrafficSimConstants.UI.Scenes.simulationMap);
    }

    dispose(): void {
        this.#vehicles.forEach(v => v.dispose());
    }
}