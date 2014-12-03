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
JSVTS.Mover = {
    TotalElapsedTime: 0,
    ChangeLaneDelay: 5000, // don't change lanes for 5 seconds after a change
    CRASH_CLEANUP_MAX_DELAY: 300000, // 5 min
    CRASH_CLEANUP_MIN_DELAY: 60000, // 1 min

    move: function(elapsedMilliseconds, vehicleIds){
        // if a subset of ids passed in then filter to those vehicles only
        var segments = JSVTS.Map.GetSegments();
        for (var i in segments) {
            var segment = segments[i];
            if (segment.tfc) {
                segment.tfc.update(JSVTS.Mover.TotalElapsedTime);
            }
            if (segment.generator) {
                segment.generator.update(JSVTS.Mover.TotalElapsedTime);
            }
        }
        var vehicles = JSVTS.Map.GetVehicles();
        if (vehicleIds) {
            // only move the vehicles we're interested in
            var matches = vehicleIds.filter(function (el) {
                for (var i in vehicleIds) {
                    if (vehicleIds[i].id === el.id) {
                        return true;
                    }
                }
                return false;
            });
            vehicles = matches;
        }
        for (var m in vehicles) {
            var v = vehicles[m];
            
            var segment = JSVTS.Map.GetSegmentById(v.segmentId);
            var speed = v.velocity;
            var IsStopping = false;
            var elapsedSeconds = (elapsedMilliseconds / 1000);
            var distTraveled = (speed * elapsedSeconds);
            if(distTraveled > 0){
                var remainingDistOnSegment = JSVTS.Mover.GetDistanceBetweenTwoPoints(v.config.location, v.segmentEnd);
                if (distTraveled >= remainingDistOnSegment) {
                    // if there is a next Segment
                    var nextSegments = JSVTS.Map.GetAvailableSegmentsContainingPoint(v.segmentEnd);
                    if(nextSegments && nextSegments.length > 0){
                        if (v.isChangingLanes) {
                            v.isChangingLanes = false;
                        }
                        // move to segment (pick randomly)
                        var randIndex = Math.floor((Math.random()*nextSegments.length));
                        var nextSeg = nextSegments[randIndex];
                        nextSeg.attachVehicle(v, v.segmentEnd);

                        distTraveled -= remainingDistOnSegment;
                    } else{
                        // remove v from the Simulation
                        JSVTS.Map.removeVehicle(v);
                    }
                }
                if (v) {
                    if (distTraveled >= 0.1) {
                        v.moveBy(distTraveled);
                    }

                    if (JSVTS.Mover.shouldStop(v, segment)) {
                        IsStopping = true;
                    }
                }
            }

            if (v) {
                if (v.crashed) {
                    v.velocity = 0;
                    if (v.crashCleanupTime) {
                        // remove vehicle after
                        if (v.crashCleanupTime <= JSVTS.Mover.TotalElapsedTime) {
                            // remove v from the Simulation
                            console.log("Vehicle removed: "+v.id);
                            JSVTS.Map.removeVehicle(v);
                        }
                    } else {
                        console.log("Vehicle crashed: "+v.id);
                        var rand = Math.random();
                        if (rand <= 0.8) {
                            v.crashCleanupTime = Math.random() * JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY;
                        }
                        v.crashCleanupTime = Math.random() * (JSVTS.Mover.CRASH_CLEANUP_MAX_DELAY - JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY) + JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY;
                    }
                } else {
                    v.updateVelocity(elapsedMilliseconds, IsStopping);
                }
            }
        }
            
        JSVTS.Mover.TotalElapsedTime += elapsedMilliseconds;
    },
    
    changeLanesIfAvailable: function(v, currentSegment) {
        if (!v.changeLaneTime || v.changeLaneTime < JSVTS.Mover.TotalElapsedTime) {
            var closestPoint = null;
            if (v && currentSegment) {
                var possibleLanes = JSVTS.Map.GetSimilarSegmentsInRoad(currentSegment);
                for (var i in possibleLanes) {
                    var possibleLane = possibleLanes[i];
                    // check angle to all change points on possible lane
                    for (var j in possibleLane.laneChangePoints) {
                        var point = possibleLane.laneChangePoints[j];
                        var line1 = new THREE.Line3(new THREE.Vector3().copy(v.config.location), new THREE.Vector3().copy(point));
                        var line2 = new THREE.Line3(new THREE.Vector3().copy(currentSegment.config.start), new THREE.Vector3().copy(currentSegment.config.end));
                        var angle = Math.abs(JSVTS.Mover.angleFormedBy(line1, line2));
                        if (angle <= 25 && angle > 5) {
                            if (!closestPoint) {
                                closestPoint = point;
                            } else {
                                if (JSVTS.Mover.GetDistanceBetweenTwoPoints(point, v.config.location) <
                                    JSVTS.Mover.GetDistanceBetweenTwoPoints(closestPoint, v.config.location)) {
                                    closestPoint = point;
                                }
                            }
                        }
                    }
                }
            }

            if (closestPoint) {
                var seg = new JSVTS.Segment({
                    start: new THREE.Vector3().copy(v.config.location),
                    end: new THREE.Vector3().copy(closestPoint),
                    desiredVelocity: v.desiredVelocity
                });
                var tmpV = new JSVTS.Vehicle().copyFrom(v);
                seg.attachVehicle(tmpV);
                if (!JSVTS.Mover.shouldStop(tmpV, seg, undefined, true)) {
                    seg.attachVehicle(v);
                    v.changeLaneTime = JSVTS.Mover.TotalElapsedTime + JSVTS.Mover.ChangeLaneDelay;
                    v.isChangingLanes = true;
                    return true;
                }
            }
        }

        return false;
    },

    shouldStop: function (vehicle, segment, distance, skipCollisionCheck) {
        if (vehicle && segment) {
            var dist = distance || vehicle.getLookAheadDistance();
            // check for vehicles in range
            var foundV = JSVTS.Mover.AreVehiclesWithinDistance(vehicle, segment, dist, skipCollisionCheck);
            if (foundV && foundV.stop) {
                var changingLanes = JSVTS.Mover.changeLanesIfAvailable(vehicle, segment, dist);
                if (!changingLanes) {
                   return foundV;
                }
            }
            var foundTfc = JSVTS.Mover.AreTfcsWithinDistance(vehicle, segment, dist);
            if (foundTfc && foundTfc.stop) { // and then check for traffic lights in range
                return foundTfc;
            }
            var foundCorner = JSVTS.Mover.shouldSlowForCorner(vehicle, dist);
            if (foundCorner && foundCorner.stop) { // and finally check for cornering in range
                return foundCorner;
            }

            return JSVTS.Mover.checkSubsequentSegments(vehicle, segment, dist);
        }

        return false;
    },

    checkSubsequentSegments: function (vehicle, segment, distance) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            // get the distance from our current location to the end of the segment
            var distToSegEnd = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location, segment.config.end);
            if (distToSegEnd < distance) {
                // if the distance is greater than the remaining segment length
                // move on to viewing vehicles in next segment
                var nextSegments = JSVTS.Map.getSegmentsStartingAt(segment.config.end);
                if (nextSegments && nextSegments.length > 0) {
                    for (var i in nextSegments) {
                        var nextSeg = nextSegments[i];
                        // if angle to next segment less than 20 degrees
                        var line1 = new THREE.Line3(segment.config.start, segment.config.end);
                        var line2 = new THREE.Line3(nextSeg.config.start, nextSeg.config.end);
                        if (Math.abs(JSVTS.Mover.angleFormedBy(line1, line2)) < 20) {
                            var tmpVehicle = new JSVTS.Vehicle().copyFrom(vehicle);
                            tmpVehicle.config.location = segment.config.end;
                            nextSeg.attachVehicle(tmpVehicle);
                            var found = JSVTS.Mover.shouldStop(tmpVehicle, nextSeg, (distance - distToSegEnd), true);
                            if (found && found.stop) {
                                return found;
                            }
                        }
                    }
                }
            }
        }

        return false;
    },

    shouldSlowForCorner: function(vehicle, distance){
        // slow down when the next segment is in range and has a different heading
        var distanceToSegEnd = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location, vehicle.segmentEnd);
        if (distanceToSegEnd < distance) {
            // base the amount on how different the heading is
            var headingDiff = 0;
            var line1 = new THREE.Line3(vehicle.segmentStart, vehicle.segmentEnd);
            var nextSegments = JSVTS.Map.getSegmentsStartingAt(vehicle.segmentEnd);
            for (var i in nextSegments) {
                var nextSegment = nextSegments[i];
                var line2 = new THREE.Line3(nextSegment.config.start, nextSegment.config.end);
                var tmp = Math.abs(JSVTS.Mover.angleFormedBy(line1, line2));
                if (tmp > headingDiff) {
                    headingDiff = tmp;
                }
            }

            var corneringSpeed = JSVTS.Mover.CorneringSpeedCalculator(headingDiff);
            // begin slowing down 
            if (vehicle.velocity > corneringSpeed) {
                return { stop: true, type: "cornering", heading: headingDiff };
            }
        }

        return false;
    },

    CorneringSpeedCalculator: function(headingDifference) {
        if (headingDifference < 12) {
            // no real difference
            return 1000; // fast as you like
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
    },

    /**
     * this function will return all the stoplights on this segment
     * and any subsegments recursively down to the terminating 
     * nodes
     * @return true if tfc's are within distance
     */
    AreTfcsWithinDistance: function(vehicle, segment, distance) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            if (segment.tfc) {
                var tfc = segment.tfc;
                var distToTfc = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location, tfc.config.location);

                if (distToTfc < distance) {
                    // if TFC is RED or YELLOW
                    if (tfc.shouldStop(vehicle)) {
                        // don't stop if touching tfc
                        var box1 = new THREE.Box3().setFromObject(vehicle.mesh);
                        var box2 = new THREE.Box3().setFromObject(tfc.mesh);
                        if (!JSVTS.Mover.isCollidingWith(box1, box2)) {
                            return { stop: true, type: "tfc", segmentId: segment.id, id: tfc.id };
                        }
                    }
                }
            }
        }

        return false;
    },

    /**
     * this function will return true if any vehicles on this segment
     * and any subsegments recursively down to the terminating 
     * nodes are within the passed in distance to the passed in
     * currentLoc
     * @return {object} obj.stop = true if at least one vehicle found within range
     * otherwise false is returned instead of an object
     */
    AreVehiclesWithinDistance: function(vehicle, segment, distance, skipCollisionCheck) {
        if ((distance > 0) && (vehicle && vehicle.segmentId !== null) && (segment)) {
            var baseline = new THREE.Line3(vehicle.config.location, vehicle.segmentEnd);
            var vehicles = JSVTS.Map.GetVehicles().filter(function (v) {
                // return all vehicles on current segment or that are changing lanes which aren't this vehicle
                return (v.id !== vehicle.id); // && (v.segmentId === vehicle.segmentId || v.isChangingLanes);
            });
            var closestVeh = JSVTS.Mover.getClosestObjectWithinDistanceAndView(baseline, vehicles, distance);
            
            if (closestVeh) {
                if (!skipCollisionCheck) {
                    // perform collision check
                    var box1 = new THREE.Box3().setFromObject(vehicle.mesh);
                    var box2 = new THREE.Box3().setFromObject(closestVeh.mesh);
                    if (JSVTS.Mover.isCollidingWith(box1, box2)) {
                        vehicle.crashed = true;
                        closestVeh.crashed = true;
                    }
                }
                return { stop: true, type: "vehicle", segmentId: segment.id, id: closestVeh.id };
            }
        }

        return false;
    },

    /**
     * return the closest object within a maximum distance that falls within the 
     * specified viewing angle
     * 
     * @param baseline {THREE.Line3} - the line against which to measure the angle
     * @param objects {Array of JSVTS.objects} - an array of JSVTS.Vehicle or 
     *                                           JSVTS.TrafficFlowControl objects
     * @param distance {number} - the maximum distance to look within
     * @param maxAngle {number} - the maximum positive and negative degree offset
     *                            from current baseline heading to check within
     * @param decay {number} - percentage to shorten distance when at maxAngle
     *                         Ex: distance=100, maxAngle=90, decay=0.50
     *                             at 90 degrees the distance will be 50
     */
    getClosestObjectWithinDistanceAndView: function (baseline, objects, distance, maxAngle, decay) {
        var closest = { obj: null, dist: 0 };
        if ((distance > 0) && (baseline) && (objects && objects.length > 0)) {
            if (!maxAngle) { maxAngle = 90; }
            if (!decay) { decay = 1.0; } // 100% of length when at maxAngle 
            for (var i in objects) {
                var obj = objects[i];
                // create segment to obj
                var segToObj = new THREE.Line3(baseline.start, obj.config.location);

                // create segment to current segment end
                var segToEnd = baseline;

                // get angle formed by both lines
                var angleToObj = Math.abs(JSVTS.Mover.angleFormedBy(segToObj, segToEnd));

                if (angleToObj <= maxAngle) {
                    var distanceToObj = JSVTS.Mover.GetDistanceBetweenTwoPoints(baseline.start, obj.config.location);
                    // compare distance and angle
                    var dist = distance;
                    dist = distance - (distance * ((angleToObj / maxAngle) * decay));
                    if (distanceToObj <= dist) {
                        if (closest.obj === null || closest.dist > distanceToObj) {
                            closest.obj = obj;
                            closest.dist = distanceToObj;
                        }
                    }
                }
            }
        }

        return closest.obj;
    },

    GetDistanceBetweenTwoPoints: function (p1, p2) {
        return new THREE.Line3(new THREE.Vector3().copy(p1), new THREE.Vector3().copy(p2)).distance();
    },

    angleFormedBy: function (line1, line2) {
        var a = new THREE.Vector3().copy(line1.end).sub(line1.start).normalize();
        var b = new THREE.Vector3().copy(line2.end).sub(line2.start).normalize();
        return (Math.acos(a.dot(b))*(180/Math.PI));
    },

    isCollidingWith: function (box1, box2) {
        if (box1.isIntersectionBox(box2)) {
            return true;
        }
        return false;
    }
};