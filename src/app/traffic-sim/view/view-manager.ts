import { PerspectiveCamera, PointLight, Scene, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Renderable } from './renderable';

export class ViewManager {
    private _renderer: WebGLRenderer;
    private _scene: Scene;
    private _camera: PerspectiveCamera;
    private _controls: OrbitControls;
    private _light: PointLight;
    private _width: number;
    private _height: number;

    init(canvas?: HTMLCanvasElement, width?: number, height?: number) {
        this._width = width || this.getWidth();
        this._height = height || this.getHeight();

        this._initRenderer(this._width, this._height, canvas);
        this._initCamera(this._width, this._height);
        this._initControls();
        this._initLight();
        this._initScene(this._camera, this._light);

        this.render();
    }

    private _initRenderer(width: number, height: number, canvas: HTMLCanvasElement): void {
        this._renderer = new WebGLRenderer({canvas: canvas});
        this.resize(width, height);
    }

    private _initLight(): void {
        let pointLight = new PointLight(0xFFFFFF);
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;
        this._light = pointLight;
    }

    private _initCamera(width: number, height: number): void {
        let viewAngle = 45;
        let aspectRatio = width / height;
        let nearClip = 0.1;
        let farClip = 10000;
        this._camera = new PerspectiveCamera(viewAngle,aspectRatio,nearClip,farClip);
        this._camera.position.z = 228;
        this._camera.position.y = 250;
        this._camera.position.x = 115;
        this._camera.lookAt(new Vector3(75, 0, 115));
    }

    private _initControls(): void {
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.dampingFactor = 0.2;
        this._controls.addEventListener('change', () => ViewManager.inst.render());
    }

    private _initScene(camera: PerspectiveCamera, light: PointLight) {
        this._scene = new Scene();
        this._scene.add(camera);
        this._scene.add(light);
    }

    render(): void {
        this._renderer.render(this._scene, this._camera);
    }

    reset(){
        this._renderer = null;
        this._scene = null;
        this._camera = null;
        this._controls = null;
    }

    resize(width: number, height: number): void {
        this._renderer.setSize(width, height);
        if (this._camera) {
            this._camera.aspect = width / height;
            this._camera.updateProjectionMatrix();
            this.render();
        }
    }

    addRenderable<T extends Renderable>(renderable: T): void {
        this._scene.add(renderable.getMesh());
    }

    removeRenderable<T extends Renderable>(renderable: T): void {
        this._scene.remove(renderable.getMesh());
    }

    getWidth(): number {
        return window.innerWidth;
    }

    getHeight(): number {
        return window.innerHeight;
    }
}

export module ViewManager {
    export var inst = new ViewManager();
}