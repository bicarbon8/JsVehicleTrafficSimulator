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
    this.velocity = 0; // Km/h
    this.crashed = false;
    this.crashCleanupTime = null;
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
    var distanceTot = distanceToStop + (this.config.length * 2) + distanceToReact;
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
    var removed = false;

    if (this.shouldStop()) {
        IsStopping = true;
    }
    this.updateVelocity(elapsedMs, IsStopping);

    var distTraveled = (this.velocity * elapsedSeconds);
    if(distTraveled > 0) {
        var remainingDistOnSegment = JSVTS.Utils.getDistanceBetweenTwoPoints(this.config.location, this.segment.config.end);
        if (distTraveled >= remainingDistOnSegment) {
            // if there is a next Segment
            var nextSegments = null;
            if (this.isChangingLanes) {
                this.isChangingLanes = false;
                nextSegments = JSVTS.Map.getAvailableSegmentsContainingPoint(this.segment.config.end);
            } else {
                nextSegments = JSVTS.Map.getSegmentsStartingAt(this.segment.config.end);
            }
            
            if(nextSegments && nextSegments.length > 0){
                // move to segment (pick randomly)
                // TODO: lookup values from vehicle's choosen path
                var randIndex = Math.floor((Math.random() * nextSegments.length));
                var nextSeg = nextSegments[randIndex];
                nextSeg.attachMovable(this, this.segment.config.end, nextSeg.config.end);

                distTraveled -= remainingDistOnSegment;
            } else{
                // remove self from the Simulation
                JSVTS.Map.removeMovable(this);
                removed = true;
            }
        }
    }

    if (!removed) {
        if (this.crashed) {
            this.brake(elapsedMs);
            if (this.crashCleanupTime) {
                // remove vehicle after
                if (this.crashCleanupTime <= JSVTS.totalElapsedTime) {
                    // remove self from the Simulation
                    console.log("Vehicle removed: "+this.id);
                    JSVTS.Map.removeMovable(this);
                }
            } else {
                console.log("Vehicle crashed: "+this.id);
                var rand = Math.random();
                if (rand <= 0.8) {
                    this.crashCleanupTime = Math.random() * JSVTS.CRASH_CLEANUP_MIN_DELAY;
                }
                this.crashCleanupTime = Math.random() * (JSVTS.CRASH_CLEANUP_MAX_DELAY - JSVTS.CRASH_CLEANUP_MIN_DELAY) + JSVTS.CRASH_CLEANUP_MIN_DELAY;
            }
        } else {
            this.moveBy(distTraveled);
        }
    }
};

JSVTS.Vehicle.prototype.updateVelocity = function (elapsedMs, isStopping) {
    if (this.segment) {
        // speed up or slow down
        if (this.velocity < this.segment.config.speedLimit && !isStopping) {
            // speed up: avg. rate of acceleration is 3.5 m/s^2
            this.accelerate(elapsedMs);
        }
        if (this.velocity > this.segment.config.speedLimit || isStopping) {
            // slow down: avg. rate of deceleration is 3.5 m/s^2
            this.brake(elapsedMs);
        }
    }
};

JSVTS.Vehicle.prototype.accelerate = function (elapsedMs) {
    var elapsedSeconds = elapsedMs/1000;
    this.velocity += (JSVTS.Utils.convertMpsToKmph(this.config.acceleration * elapsedSeconds));
    // prevent going too fast
    if (this.velocity > this.segment.config.speedLimit) {
        this.velocity = this.segment.config.speedLimit;
    }
    this.mesh.material.color.setHex(0x66ff66);
};

JSVTS.Vehicle.prototype.brake = function (elapsedMs) {
    var elapsedSeconds = elapsedMs/1000;
    this.velocity -= (JSVTS.Utils.convertMpsToKmph(this.config.deceleration * elapsedSeconds));
    // prevent going backwards
    if (this.velocity < 0) {
        this.velocity = 0;
    }
    this.mesh.material.color.setHex(0xff0000);
};

JSVTS.Vehicle.prototype.getBoundingBox = function () {
    this.mesh.geometry.computeBoundingBox();
    return this.mesh.geometry.boundingBox;
};

JSVTS.Vehicle.prototype.shouldStop = function (segment, distance, skipCollisionCheck) {
    if (!segment) {
        segment = this.segment;
    }

    var dist = distance || this.getLookAheadDistance();
    // check for vehicles in range
    var foundV = JSVTS.Map.areVehiclesWithinDistance(this, dist, skipCollisionCheck);
    if (foundV && foundV.stop) {
        if (skipCollisionCheck) {
            return foundV;
        } else {
            // perform collision check
            var box1 = new THREE.Box3().setFromObject(this.mesh);
            var vehicle = JSVTS.Map.getMovableById(foundV.id);
            var box2 = new THREE.Box3().setFromObject(vehicle.mesh);
            if (JSVTS.Utils.isCollidingWith(box1, box2)) {
                this.crashed = true;
                vehicle.crashed = true;
            }
        }
        var changingLanes = this.changeLanesIfAvailable(segment);
        if (!changingLanes) {
            return foundV;
        }
    }
    // check for traffic flow controllers
    var foundTfc = JSVTS.Map.areTfcsWithinDistance(this, dist);
    if (foundTfc && foundTfc.stop) { // and then check for traffic lights in range
        return foundTfc;
    }
    // check for corners
    var foundCorner = this.shouldSlowForCorner(dist);
    if (foundCorner && foundCorner.stop) { // and finally check for cornering in range
        return foundCorner;
    }

    return this.checkSubsequentSegments(dist);
};

JSVTS.Vehicle.prototype.checkSubsequentSegments = function (distance) {
    if ((distance > 0) && (this.segmentId !== null)) {
        var skipCollisionCheck = true;
        var nextSegments = JSVTS.Map.getAvailableSegmentsContainingPoint(this.segment.config.end).filter(function (seg) {
            return seg.id !== this.segmentId;
        });
        for (var i in nextSegments) {
            var nextSeg = nextSegments[i];
            
            var tmpVehicle = new JSVTS.Vehicle({ generateId: false });
            tmpVehicle.id = this.id;
            nextSeg.attachMovable(tmpVehicle, this.segment.config.end, nextSeg.config.end);
            var remainingDistOnSegment = JSVTS.Utils.getDistanceBetweenTwoPoints(this.config.location, this.segment.config.end);
            if (remainingDistOnSegment > 0) {
                var found = tmpVehicle.shouldStop(nextSeg, (distance - remainingDistOnSegment), skipCollisionCheck);
                if (found && found.stop) {
                    return found;
                }
            }
        }
    }

    return false;
};

JSVTS.Vehicle.prototype.changeLanesIfAvailable = function(currentSegment) {
    if (!this.changeLaneTime || this.changeLaneTime < JSVTS.TotalElapsedTime) {
        var closestPoint = null;
        if (currentSegment) {
            var possibleLanes = JSVTS.Map.getSimilarSegmentsInRoad(currentSegment);
            for (var i in possibleLanes) {
                var possibleLane = possibleLanes[i];
                // check angle to all change points on possible lane
                for (var j in possibleLane.laneChangePoints) {
                    var point = possibleLane.laneChangePoints[j];
                    var line1 = new THREE.Line3(this.config.location, point);
                    var line2 = new THREE.Line3(currentSegment.config.start, currentSegment.config.end);
                    var angle = Math.abs(JSVTS.Utils.angleFormedBy(line1, line2));
                    if (angle <= 25 && angle > 5) {
                        if (!closestPoint) {
                            closestPoint = point;
                        } else {
                            if (line1.distance() <
                                JSVTS.Utils.getDistanceBetweenTwoPoints(closestPoint, this.config.location)) {
                                closestPoint = point;
                            }
                        }
                    }
                }
            }
        }

        if (closestPoint) {
            // create tmp segment to new lane
            var seg = new JSVTS.Segment({
                start: this.config.location,
                end: closestPoint,
                speedLimit: this.segment.config.speedLimit
            });
            var tmpV = new JSVTS.Vehicle({ generateId: false });
            tmpV.id = this.id;
            seg.attachMovable(tmpV, seg.config.start, seg.config.end);
            // don't change lanes if we just have to stop on the new lane too
            var distance = this.getLookAheadDistance() * 2;
            if (!tmpV.shouldStop(seg, distance, true)) {
                seg.attachMovable(this, seg.config.start, seg.config.end);
                this.changeLaneTime = JSVTS.TotalElapsedTime + (this.config.changeLaneDelay * 1000);
                this.isChangingLanes = true;
                return true;
            }
        }
    }

    return false;
};

JSVTS.Vehicle.prototype.shouldSlowForCorner = function(distance){
    // slow down when the next segment is in range and has a different heading
    var distanceToSegEnd = JSVTS.Utils.getDistanceBetweenTwoPoints(this.config.location, this.segment.config.end);
    if (distanceToSegEnd < distance) {
        // base the amount on how different the heading is
        var headingDiff = 0;
        var line1 = new THREE.Line3(this.segment.config.start, this.segment.config.end);
        var nextSegments = JSVTS.Map.getSegmentsStartingAt(this.segment.config.end);
        for (var i in nextSegments) {
            var nextSegment = nextSegments[i];
            var line2 = new THREE.Line3(nextSegment.config.start, nextSegment.config.end);
            var tmp = Math.abs(JSVTS.Utils.angleFormedBy(line1, line2));
            if (tmp > headingDiff) {
                headingDiff = tmp;
            }
        }

        var corneringSpeed = this.corneringSpeedCalculator(headingDiff, this.velocity);
        // begin slowing down 
        if (this.velocity > corneringSpeed) {
            return { stop: true, type: "cornering", heading: headingDiff };
        }
    }

    return false;
};

JSVTS.Vehicle.prototype.corneringSpeedCalculator = function(headingDifference) {
    if (headingDifference < 12) {
        // no real difference
        return this.velocity; // fast as you like
    }
    if (headingDifference < 25) {
        // mild / gentle curve
        return 100; // don't exceed 100 Km/h
    }
    if (headingDifference < 45) {
        return 30;
    }
    if (headingDifference < 90) {
        return 10;
    }
    if (headingDifference < 135) {
        return 5;
    }
    if (headingDifference >= 135) {
        return 1;
    }
};

JSVTS.Vehicle.prototype.hasInView = function(location) {
    var headingLine = new THREE.Line3(this.config.location, this.segment.config.end);
    var headingToLocation = new THREE.Line3(this.config.location, location);
    var maxAngle = 45;
    if (this.isChangingLanes) {
        maxAngle = 90;
    }

    if (Math.abs(JSVTS.Utils.angleFormedBy(headingLine, headingToLocation)) <= maxAngle) {
        return true;
    }

    return false;
};