/**********************************************************************
 * This javascript is part of a Vehicle Traffic Simulator written 
 * entirely in Javascript, HTML and CSS.  The application allows for 
 * the creation of roadways upon which vehicles will travel and
 * attempt to avoid collisions with other vehicles while obeying the
 * rules of the road including traffic lights and speed limits
 * 
 * @Created: 04/09/2013
 * @Author: Jason Holt Smith (bicarbon8@gmail.com)
 * @Version: 0.2.0
 * Copyright (c) 2013 Jason Holt Smith. JsVehicleTrafficSimulator is 
 * distributed under the terms of the GNU General Public License.
 * 
 * This file is part of JsVehicleTrafficSimulator.
 * 
 * JsVehicleTrafficSimulator is free software: you can redistribute it 
 * and/or modify it under the terms of the GNU General Public License 
 * as published by the Free Software Foundation, either version 3 of 
 * the License, or (at your option) any later version.
 * 
 * JsVehicleTrafficSimulator is distributed in the hope that it will 
 * be useful, but WITHOUT ANY WARRANTY; without even the implied 
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  
 * See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with JsVehicleTrafficSimulator.  If not, see 
 * <http://www.gnu.org/licenses/>.
 **********************************************************************/
var JSVTS = JSVTS || {};
JSVTS.VEH_OPTIONS = function () {
    var self = {
        width: 2,
        length: 4,
        height: 2,
        desiredVelocity: 0,
        reactionTime: 2.5, // seconds to react
        acceleration: 3.5, // meters per second
        deceleration: 7, // meters per second
        changeLaneDelay: 5 // don't change lanes for 5 seconds after a change
    };
    return self;
};
JSVTS.Vehicle = function(options) {
    var defaults = JSVTS.VEH_OPTIONS();
    for (var key in options) { defaults[key] = options[key]; }
    JSVTS.Renderable.call(this, defaults);

    this.isChangingLanes = false;
    this.changeLaneTime = null;
    this.segmentId = null;
    this.segmentStart = null;
    this.segmentEnd = null;
    this.velocity = 0; // Km/h
    this.crashed = false;
    this.crashCleanupTime = null;
    this.idMesh = null;
};
JSVTS.Vehicle.prototype = Object.create(JSVTS.Renderable.prototype);
JSVTS.Vehicle.prototype.constructor = JSVTS.Vehicle;

JSVTS.Vehicle.prototype.copyFrom = function (vehicle) {
    if (vehicle) {
        this.init(vehicle.config);
        for (var property in vehicle) {
            if (typeof vehicle[property] !== "function" && typeof vehicle[property] !== "object") {
                self[property] = vehicle[property];
            }
        }
        return this;
    }
};

JSVTS.Vehicle.prototype.getLookAheadDistance = function () {
    /**
     * distance to decelerate from current velocity to 0
     * (2) d = -u² / 2a
     * v = desired velocity (0 mps)
     * u = current velocity (mps)
     * a = acceleration (mps)
     * d = distance (m)
     */
    var mps = JSVTS.Utils.convertKmphToMps(this.velocity);
    var distanceToStop = (-(Math.pow(mps, 2)) / (2 * -(this.config.deceleration))) / 2;
    var distanceToReact = this.config.reactionTime * mps;
    var distanceTot = distanceToStop + (this.config.length * 2.5) + distanceToReact;
    // TODO: use distanceToReact as a setTimeout for when to check distances again
    return distanceTot;
};

JSVTS.Vehicle.prototype.generateMesh = function(options) {
    if (!this.mesh) {
        // z coordinate used for vertical height
        var geometry = new THREE.BoxGeometry(options.width, options.height, options.length);
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
        var mesh = new THREE.Mesh(geometry, material);
        this.mesh = mesh;
    }
};

JSVTS.Vehicle.prototype.update = function (elapsedMs) {
    var IsStopping = false;
    var elapsedSeconds = (elapsedMs / 1000);
    var distTraveled = (this.velocity * elapsedSeconds);
    var removed = false;
    if(distTraveled > 0) {
        var remainingDistOnSegment = JSVTS.Utils.getDistanceBetweenTwoPoints(this.config.location, this.segmentEnd);
        if (distTraveled >= remainingDistOnSegment) {
            // if there is a next Segment
            var nextSegments = null;
            if (this.isChangingLanes) {
                this.isChangingLanes = false;
                nextSegments = JSVTS.Map.GetAvailableSegmentsContainingPoint(this.segmentEnd);
            } else {
                nextSegments = JSVTS.Map.getSegmentsStartingAt(this.segmentEnd);
            }
            
            if(nextSegments && nextSegments.length > 0){
                // move to segment (pick randomly)
                // TODO: lookup values from vehicle's choosen path
                var randIndex = Math.floor((Math.random() * nextSegments.length));
                var nextSeg = nextSegments[randIndex];
                nextSeg.attachVehicle(this, this.segmentEnd);

                distTraveled -= remainingDistOnSegment;
            } else{
                // remove self from the Simulation
                JSVTS.Map.removeVehicle(this);
                removed = true;
            }
        }
        if (!removed) {
            this.moveBy(distTraveled);
            var segment = JSVTS.Map.GetSegmentById(this.segmentId);
            if (JSVTS.Mover.shouldStop(this, segment)) {
                IsStopping = true;
            }
        }
    }

    if (!removed) {
        if (this.crashed) {
            this.velocity = 0;
            if (this.crashCleanupTime) {
                // remove vehicle after
                if (this.crashCleanupTime <= JSVTS.Mover.TotalElapsedTime) {
                    // remove self from the Simulation
                    console.log("Vehicle removed: "+this.id);
                    JSVTS.Map.removeVehicle(this);
                }
            } else {
                console.log("Vehicle crashed: "+this.id);
                var rand = Math.random();
                if (rand <= 0.8) {
                    this.crashCleanupTime = Math.random() * JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY;
                }
                this.crashCleanupTime = Math.random() * (JSVTS.Mover.CRASH_CLEANUP_MAX_DELAY - JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY) + JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY;
            }
        } else {
            this.updateVelocity(elapsedMs, IsStopping);
        }
    }
};

JSVTS.Vehicle.prototype.updateVelocity = function (elapsedMs, isStopping) {
    // speed up or slow down
    if (this.velocity < this.config.desiredVelocity && !isStopping) {
        // speed up: avg. rate of acceleration is 3.5 m/s^2
        this.accelerate(elapsedMs);
    }
    if (this.velocity > this.config.desiredVelocity || isStopping) {
        // slow down: avg. rate of deceleration is 3.5 m/s^2
        this.brake(elapsedMs);
    }
};

JSVTS.Vehicle.prototype.accelerate = function (elapsedMs) {
    var elapsedSeconds = elapsedMs/1000;
    this.velocity += (JSVTS.Utils.convertMpsToKmph(this.config.acceleration * elapsedSeconds));
    this.mesh.material.color.setHex(0x66ff66);
};

JSVTS.Vehicle.prototype.brake = function (elapsedMs) {
    var elapsedSeconds = elapsedMs/1000;
    this.velocity -= (JSVTS.Utils.convertMpsToKmph(this.config.deceleration * elapsedSeconds));
    // prevent going backwards
    if (this.velocity < 0.1) {
        this.velocity = 0;
    }
    this.mesh.material.color.setHex(0xff0000);
};

JSVTS.Vehicle.prototype.getBoundingBox = function () {
    this.mesh.geometry.computeBoundingBox();
    return this.mesh.geometry.boundingBox;
};