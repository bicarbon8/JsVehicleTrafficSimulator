import { AxesViewer, Engine, FreeCamera, HemisphericLight, Scene, Vector3 } from 'babylonjs';
import { Renderable } from './renderable';

export class ViewManager {
    private _renderer: Engine;
    private _scene: Scene;
    private _camera: FreeCamera;
    private _light: HemisphericLight;
    private _canvas: HTMLCanvasElement;

    init(canvasId: string) {
        this._initRenderer(canvasId);
        this._initScene();
        this._initCamera();
        this._initControls();
        this._initLight();
        
        this.update();
    }

    get scene(): Scene {
        return this._scene;
    }

    private _initRenderer(canvasId: string): void {
        this._canvas = document.querySelector<HTMLCanvasElement>(canvasId);
        this._renderer = new Engine(this._canvas, false, {preserveDrawingBuffer: true, stencil: true});
        this._renderer.setSize(this.getWidth(), this.getHeight());
        window.addEventListener('resize', () => {
            this.resize();
            this.update();
        }, { capture: false });
    }

    private _initLight(): void {
        const light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
        this._light = light;
    }

    private _initCamera(): void {
        let viewAngle = 45;
        let aspectRatio = this.getWidth() / this.getHeight();
        let nearClip = 0.1;
        let farClip = 10000;
        this._camera = new FreeCamera('camera1', new Vector3(200, 200, 200), this.scene, );
        this._camera.setTarget(new Vector3(0, 0, 0));
        this._camera.attachControl(this._canvas, false);
    }

    private _initControls(): void {
        
    }

    private _initScene() {
        this._scene = new Scene(this._renderer);
        const axes = new AxesViewer(this._scene, 100);
    }

    update(): void {
        this.scene.render();
    }

    reset(): void {
        this._renderer = null;
        this._scene = null;
        this._camera = null;
    }

    destroy(): void {
        this._renderer.dispose();
        this._scene = null;
        this._camera = null;
        this._renderer = null;
    }

    resize(): void {
        let width: number = this.getWidth();
        let height: number = this.getHeight();
        this._renderer.setSize(width, height);
        if (this._camera) {
            // this._camera.aspect = width / height;
            // this._camera.updateProjectionMatrix();
        }
    }

    // addRenderable<T extends Renderable>(renderable: T): void {
    //     this._scene.add(renderable.obj3D);
    // }

    // removeRenderable<T extends Renderable>(renderable: T): void {
    //     this._scene.remove(renderable.obj3D);
    // }

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