import { AxesHelper, PerspectiveCamera, PointLight, Scene, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Renderable } from './renderable';

export class ViewManager {
    private _renderer: WebGLRenderer;
    private _scene: Scene;
    private _camera: PerspectiveCamera;
    private _controls: OrbitControls;
    private _light: PointLight;
    private _canvas: HTMLCanvasElement;

    init(canvasId: string) {
        this._initRenderer(canvasId);
        this._initCamera();
        this._initControls();
        this._initLight();
        this._initScene();

        this.update();
    }

    get scene(): Scene {
        return this._scene;
    }

    private _initRenderer(canvasId: string): void {
        this._canvas = document.querySelector<HTMLCanvasElement>(canvasId);
        this._renderer = new WebGLRenderer({ canvas: this._canvas });
        this._renderer.setSize(this.getWidth(), this.getHeight());
        window.addEventListener('resize', () => {
            this.resize();
            this.update();
        }, { capture: false });
    }

    private _initLight(): void {
        let pointLight = new PointLight(0xFFFFFF); // white
        pointLight.position.x = 10;
        pointLight.position.y = 50;
        pointLight.position.z = 130;
        this._light = pointLight;
    }

    private _initCamera(): void {
        let viewAngle = 45;
        let aspectRatio = this.getWidth() / this.getHeight();
        let nearClip = 0.1;
        let farClip = 10000;
        this._camera = new PerspectiveCamera(viewAngle, aspectRatio, nearClip, farClip);
        this._camera.position.set(200, 200, 200);
        this._camera.lookAt(new Vector3(0, 0, 0));
    }

    private _initControls(): void {
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.dampingFactor = 0.2;
    }

    private _initScene() {
        this._scene = new Scene();
        let axesHelper = new AxesHelper(100);
        this._scene.add(axesHelper, this._light);
    }

    update(): void {
        this._renderer?.render(this._scene, this._camera);
    }

    reset(): void {
        this._renderer = null;
        this._scene = null;
        this._camera = null;
        this._controls = null;
    }

    destroy(): void {
        this._renderer.dispose();
        this._controls.dispose();
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._controls = null;
    }

    resize(): void {
        let width: number = this.getWidth();
        let height: number = this.getHeight();
        this._renderer.setSize(width, height);
        if (this._camera) {
            this._camera.aspect = width / height;
            this._camera.updateProjectionMatrix();
        }
    }

    addRenderable<T extends Renderable>(renderable: T): void {
        this._scene.add(renderable.obj3D);
    }

    removeRenderable<T extends Renderable>(renderable: T): void {
        this._scene.remove(renderable.obj3D);
    }

    getWidth(): number {
        return window.innerWidth;
    }

    getHeight(): number {
        return window.innerHeight * 0.8;
    }
}

export module ViewManager {
    export var inst = new ViewManager();
}