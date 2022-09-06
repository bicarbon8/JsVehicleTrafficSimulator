export module TrafficSimConstants {
    export module UI {
        export module Scenes {
            export const simulationMap = 'simulation-map';
        }
        export module Layers {
            export module Background {
                export const Depth = 0;
            }
            export module Roads {
                export const Depth = 1;
            }
            export module Vehicles {
                export const Depth = 2;
            }
            export module TFCs {
                export const Depth = 3;
            }
            export module Hud {
                export const Depth = 4;
            }
        }
        export module Camera {
            export module Zoom {
                export const min = 0;
                export const max = 4;
            }
            export const scrollSpeed = 5; // pixels per update call
        }
    }
    export module Vehicles {
        export module Width {
            export const min = 2;
            export const max = 3;
        }
        export module Length {
            export const min = 3;
            export const max = 5;
        }
        export module Speed {
            export const max = 200;
        }
        export module ReactionTime {
            export const min = 500; // 1/2 sec
            export const max = 1000; // 1 sec
        }
        export module Acceleration {
            export const min = 2; // metres / sec
            export const max = 3; // metres / sec
        }
        export module Deceleration {
            export const min = 2; // metres / sec
            export const max = 3; // metres / sec
        }
        export module ChangeLaneDelay {
            export const min = 30000; // 30 seconds
            export const max = 120000; // 2 min
        }
        export module CrashCleanupDelay {
            export module LowSpeed {
                export const min = 60000; // 1 min
                export const max = 600000; // 10 min
            }
            export module MediumSpeed {
                export const min = 600000; // 10 min
                export const max = 1300000; // 30 min
            }
            export module HighSpeed {
                export const min = 1300000; // 30 min
                export const max = 2600000; // 1 hour
            }
        }
    }
    export module map {

    }
}