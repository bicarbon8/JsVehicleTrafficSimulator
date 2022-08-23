export module SimulationConstants {
    export module Vehicles {
        export module ReactionTime {
            export const min = 500; // 1/2 sec
            export const max = 1000; // 2 sec
        }
        export module Acceleration {
            export const min = 3; // metres / sec
            export const max = 4; // metres / sec
        }
        export module Deceleration {
            export const min = 4; // metres / sec
            export const max = 5; // metres / sec
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