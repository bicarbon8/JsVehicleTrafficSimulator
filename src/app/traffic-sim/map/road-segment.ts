import { Line3, Mesh, Vector3, LineBasicMaterial, BufferGeometry, Line, TextGeometry, FontLoader, LineCurve3, SphereGeometry, MeshBasicMaterial, Quaternion } from 'three';
import { TrafficFlowControl } from '../objects/traffic-controls/traffic-flow-control';
import { TrafficObject } from '../objects/traffic-object';
import { Vehicle } from '../objects/vehicles/vehicle';
import { VehicleGenerator } from '../objects/vehicles/vehicle-generator';
import { SimulationManager } from '../simulation-manager';
import { RoadSegmentOptions } from './road-segment-options';

export class RoadSegment extends TrafficObject {
    readonly id: number;
    readonly name: string;
    readonly speedLimit: number;
    readonly width: number;

    private _line: Line3;
    private _vehicles: Map<number, Vehicle>;
    private _tfcs: Map<number, TrafficFlowControl>;
    private _laneChangeLocations: Vector3[];
    private _generator: VehicleGenerator;

    constructor(options?: RoadSegmentOptions, simMgr?: SimulationManager) {
        super(options, simMgr);
        if (!options) {
            options = {start: new Vector3(0, 0, 0), end: new Vector3(0, 0, 0)};
        }
        this.speedLimit = options.speedLimit || Infinity;
        this._line = new Line3(options.start || new Vector3(), options.end || new Vector3());
        this.width = options.width || 3;
        this._vehicles = new Map<number, Vehicle>();
        this._tfcs = new Map<number, TrafficFlowControl>();
        this._laneChangeLocations = [];
    }
    
    getLaneChangePoints(): Vector3[] {
        return this._laneChangeLocations;
    }

    getVehicles(): Vehicle[] {
        return Array.from(this._vehicles.values());
    }

    addVehicle(vehicle: Vehicle, location?: Vector3): void {
        let loc: Vector3 = location || this._line.start;
        console.info(`adding vehicle '${vehicle.id}' at '${JSON.stringify(loc)}'`);
        vehicle.moveTo(loc);
        vehicle.lookAt(this._line.end);
        vehicle.setSegmentId(this.id);
        this._vehicles.set(vehicle.id, vehicle);
    }

    removeVehicle(vehicleId: number): boolean {
        return this._vehicles.delete(vehicleId);
    }

    getTfcs(): TrafficFlowControl[] {
        return Array.from(this._tfcs.values());
    }

    addTfc(tfc: TrafficFlowControl, location?: Vector3): void {
        let loc: Vector3 = location || this._line.end;
        console.debug(`adding tfc '${tfc.id}' at '${JSON.stringify(loc)}' to segment '${this.id}'`);
        tfc.moveTo(loc);
        tfc.lookAt(this._line.start);
        tfc.setSegmentId(this.id);
        this._tfcs.set(tfc.id, tfc);
    }

    removeTfc(tfcId: number): boolean {
        return this._tfcs.delete(tfcId);
    }

    getVehicleGenerator(): VehicleGenerator {
        return this._generator;
    }

    setVehicleGenerator(generator: VehicleGenerator): void {
        this._generator = generator;
    }

    protected generateMesh(): Mesh {
        let mesh: Mesh;
    
        var material = new LineBasicMaterial({
            color: 0xffffff, // white
        });
        var geometry = new BufferGeometry().setFromPoints([this._line.start, this._line.end]);
        var line = new Line(geometry, material);
        mesh = new Mesh(line.geometry, line.material);
    
        var identity: string = this.id.toString();
        if (this.name && this.name !== '') {
            identity = this.name;
        }
        let loader = new FontLoader();
        loader.load('/examples/fonts/helvetiker_regular.typeface.json', (font) => {
            let text = new TextGeometry(identity, {
                font: font,
                size: 80,
                height: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            var textMesh = new Mesh(text, material);
            let pt: Vector3 = this.getCenter();
            textMesh.position.set(pt.x, pt.y, pt.z);
            textMesh.lookAt(this._line.end);
            textMesh.rotateY(90*(Math.PI/180));
            textMesh.translateY(this.getMesh().position.y + 5);
            mesh.add(textMesh);
        });
        this._generateLaneChangePoints();

        return mesh;
    }

    private _generateLaneChangePoints(): void {
        var point = new SphereGeometry(1);
        var pointMat = new MeshBasicMaterial();
        var sphere = new Mesh(point, pointMat);
        
        // place point every [spacing] units (metres)
        var spacing = 1;
        for (var i=spacing; i<this.getLength(); i+=spacing) {
            sphere.position.set(this._line.start.x, this._line.start.y, this._line.start.z);
            sphere.lookAt(this._line.end);
            sphere.translateZ(i);
            this._laneChangeLocations.push(sphere.position.clone());
        }
        sphere.geometry.dispose();
    }

    getStart(): Vector3 {
        return this.getLine().start;
    }

    getEnd(): Vector3 {
        return this.getLine().end;
    }

    getLine(): Line3 {
        return this._line.clone();
    }

    getLength(): number {
        return this._line.distance();
    }

    getCenter(): Vector3 {
        let v: Vector3 = new Vector3();
        this._line.getCenter(v);
        return v;
    }

    getTangent(): Vector3 {
        let s: LineCurve3 = new LineCurve3(this._line.start, this._line.end);
        return s.getTangent(0);
    }

    update(elapsedMs: number): void {

    }

    clone(): RoadSegment {
        let r = new RoadSegment({
            id: this.id,
            name: this.name,
            width: this.width,
            start: this._line.start,
            end: this._line.end,
            speedLimit: this.speedLimit
        });
        r.moveTo(this.getLocation());
        r.setRotation(this.getRotation());

        return r;
    }
}