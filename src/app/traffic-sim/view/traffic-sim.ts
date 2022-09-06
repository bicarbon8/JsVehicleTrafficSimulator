import * as Phaser from "phaser";
import { RoadMap } from "../map/road-map";
import { Vehicle } from "../objects/vehicles/vehicle";
import { ViewScene } from "./view-scene";

export type TrafficSimOptions = {
    debug?: boolean;
    width?: number;
    height?: number;
    parentElementId?: string;
};

export class TrafficSim {
    #conf: Phaser.Types.Core.GameConfig;
    #game: Phaser.Game;

    activeVehicle: Vehicle;
    roadMap: RoadMap;

    constructor(options?: TrafficSimOptions) {
        this.#conf = {
            type: Phaser.AUTO,
            width: options?.width || window.innerWidth,
            height: options?.height || window.innerHeight * 0.8,
            scale: {
                mode: Phaser.Scale.NONE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            backgroundColor: 0x000000,
            parent: options?.parentElementId || 'traffic-sim',
            physics: {
                default: 'arcade',
                arcade: {
                    debug: (options?.debug === undefined) ? false : options.debug,
                    gravity: { x: 0, y: 0 },
                }
            },
            roundPixels: true,
            scene: [ViewScene]
        };
    }

    get game(): Phaser.Game {
        return this.#game;
    }

    start(): this {
        this.#game = new Phaser.Game(this.#conf);

        window.addEventListener('resize', () => {
            this.game.canvas.width = +this.#conf.width || window.innerWidth;
            this.game.canvas.height = +this.#conf.height || window.innerHeight * 0.8;
            this.game.scale.refresh();
        });

        document.addEventListener("visibilitychange", () => {
            this.game.scene.getScenes(false).forEach((scene: Phaser.Scene) => {
                if (document.hidden) {
                    this.game.scene.pause(scene);
                } else {
                    this.game.scene.resume(scene);
                }
            });
        }, false);
        return this;
    }

    stop(): this {
        this.#game?.destroy(true);
        return this;
    }

    pointerToWorld(location: Phaser.Math.Vector2): Phaser.Math.Vector2 {
        return this.game.scene.getScene('view-scene')?.cameras.main.getWorldPoint(location.x, location.y) || new Phaser.Math.Vector2(location.x, location.y);
    }
}

export module TrafficSim {
    export const inst = new TrafficSim({debug: false});
}