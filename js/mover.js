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
    Map: undefined,
    TotalElapsedTime: 0,
    ChangeLaneDelay: 15000, // don't change lanes for 15 seconds after a change
    CRASH_CLEANUP_MAX_DELAY: 216000000, // 1 hour
    CRASH_CLEANUP_MIN_DELAY: 36000000, // 10 min
    move: function(elapsedMilliseconds, map, vehicleIds){
        JSVTS.Mover.Map = map;
        var fulfilled = 0;
        var segments = JSVTS.Mover.Map.GetSegments();
        // loop through each Vehicle
        var vehicles = JSVTS.Mover.Map.GetVehicles();
        for (var m in vehicles) {
            var v = vehicles[m];
            // only move the vehicles we're interested in
            if (vehicleIds && vehicleIds.length > 0) {
                var match = vehicleIds.filter(function (el) {
                    return el.id === v.id;
                });
                if (!match) {
                    break;
                }
            }
            var segment = map.GetSegmentById(v.segmentId);
            if (segment.tfc) {
                segment.tfc.update(JSVTS.Mover.TotalElapsedTime);
            }
            var speed=v.velocity;
            
            var IsStopping=false;
            var stopDistance = null;
            var elapsedSeconds=(elapsedMilliseconds/1000);
            var distTraveled=(speed*elapsedSeconds);
            if(distTraveled>0){
                var seg = new THREE.SplineCurve3([
                    new THREE.Vector3().copy(v.config.location),
                    new THREE.Vector3().copy(segment.config.end)
                ]);
                var length = seg.getLength(0);
                var t = 0; // 0 = start, 1 = end, 0.5 = middle
                if (distTraveled >= length) {
                    // remove vehicle from current segment
                    v.segmentId = null;

                    // if there is a next Segment
                    var nextSegments = JSVTS.Mover.Map.GetSegmentsStartingAt(segment.config.end);
                    if(nextSegments && nextSegments.length > 0){
                        // move to segment (pick randomly)
                        var randIndex = Math.floor((Math.random()*nextSegments.length));
                        var nextSeg = nextSegments[randIndex];
                        nextSeg.attachVehicle(v);

                        var oldLength = length;
                        length = nextSeg.getLength();
                        t = ((distTraveled - oldLength) / length);
                        seg = nextSeg.spline;
                    } else{
                        // remove v from the Simulation
                        JSVTS.Mover.removeVehicle(v);
                    }
                } else {
                    t = distTraveled / length;
                }

                if (seg && v) {
                    // set the vehicle position
                    var pt = seg.getPoint(t);
                    v.updateLocation(pt);
                }

                if (JSVTS.Mover.shouldStop(v, segment)) {
                    IsStopping = true;
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
                            JSVTS.Mover.removeVehicle(v);
                        }
                    } else {
                        console.log("Vehicle crashed: "+v.id);
                        var rand = Math.random();
                        if (rand <= 0.8) {
                            v.crashCleanupTime = Math.random() * JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY
                        }
                        v.crashCleanupTime = Math.random() * (JSVTS.Mover.CRASH_CLEANUP_MAX_DELAY - JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY) + JSVTS.Mover.CRASH_CLEANUP_MIN_DELAY;
                    }
                } else {
                    v.updateVelocity(elapsedMilliseconds, IsStopping);
                }
            }
        }
            
        JSVTS.Mover.TotalElapsedTime+=elapsedMilliseconds;
    },
    removeVehicle: function(v) {
        // remove v from the Simulation
        JSVTS.Mover.Map._vehicles = JSVTS.Mover.Map._vehicles.splice(JSVTS.Mover.Map._vehicles.indexOf(v));
        JSVTS.Controller.plotter.scene.remove(v.mesh);
        v = null;
    },
    AvailableLane: function(v,currentSegment) {
        var lane = null;
        var crossingLane = null;
        var carBounds = v.GetBoundingBox();

        for (var z=0; z<currentSegment.LaneChangeLines.length; z++) {
            var changeLine = currentSegment.LaneChangeLines[z];
            var alternateLanes = JSVTS.Mover.Map.GetSimilarSegmentsInRoad(currentSegment);
            for (var p=0; p<alternateLanes.length; p++) {
                var alt = alternateLanes[p];
                var altCars = JSVTS.Mover.Map.GetVehiclesInSegment(v.segmentId);
                if (carBounds.IntersectsLine(changeLine) && changeLine.IntersectsLine(alt)) {
                    if (altCars.length > 0) {
                        for (var q=0; q<altCars.length; q++) {
                            var altCar = altCars[q];
                            var altBounds = altCar.GetBoundingBox();
                            if (!altBounds.IntersectsLine(changeLine)) {
                                lane = alt;
                                crossingLane = changeLine;
                            }
                        }
                    } else {
                        lane = alt;
                        crossingLane = changeLine;
                    }
                }
            }
        }

        return lane;
    },
    GetHeadingToNewLane: function(v,availableLane) {
        var heading = v.config.heading;

        var laneTendrils = availableLane.LaneChangeLines;
        var carViewArea = v.GetViewArea();
        for (var i=laneTendrils.length-1; i>=0; i--) {
            var laneTendril = laneTendrils[i];
            
            if (carViewArea.IntersectsLine(laneTendril)) {
                var headingLine = new JSVTS.Segment(v.config.location,laneTendril.config.start);
                return headingLine.heading;
            }
        }

        return heading;
    },
    shouldStop: function (vehicle, segment) {
        var vehicles = false;
        var trafficControls = false;
        var cornering = false;
        // check for vehicles in range
        if (JSVTS.Mover.ShouldStopForVehicles(vehicle,segment)) {
            // TODO: implement lane changing logic
            return true;
        }
        if (JSVTS.Mover.ShouldStopForLight(vehicle,segment)) { // and then check for traffic lights in range
            // begin stopping for Traffic Light (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
            return true;
        }
        if (JSVTS.Mover.shouldSlowForCorner(vehicle, segment)) { // and finally check for cornering in range
            return true;
        }
    },
    shouldSlowForCorner: function(vehicle, segment){
        // slow down when the next segment is in range and has a different heading
        // base the amount on how different the heading is
        var headingDiff = 0;
        var distance = vehicle.getLookAheadDistance();
        var distToSegEnd = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location, segment.config.end);
        // if we can see past the end of this segment
        if (distToSegEnd < distance) {
            // then check the heading of the next segment(s)
            var nextSegments = JSVTS.Mover.Map.GetSegmentsStartingAt(segment.config.end);
            for (var i in nextSegments) {
                // get the largest heading difference
                var tmp = segment.angleFormedBy(nextSegments[i]);
                if (tmp > headingDiff) {
                    headingDiff = tmp;
                }
            }
        }

        var corneringSpeed = JSVTS.Mover.CorneringSpeedCalculator(headingDiff);
        if (corneringSpeed !== 1) {
            // begin slowing down (-15ft/s^2); 60mph (88f/s) takes 140ft to stop, but don't fully stop
            if (vehicle.velocity > (vehicle.config.desiredVelocity*corneringSpeed)) {
                return true;
            }
        }

        return false;
    },
    CorneringSpeedCalculator: function(headingDifference) {
        if (headingDifference < 12) {
            // no real difference
            return 1;
        }
        if (headingDifference < 25) {
            // mild / gentle curve
            return 0.75;
        }
        if (headingDifference < 45) {
            return 0.5;
        }
        if (headingDifference < 90) {
            return 0.25;
        }
        if (headingDifference < 135) {
            return 0.175;
        }
        if (headingDifference >= 135) {
            return 0.0875;
        }
    },
    ShouldStopForVehicles: function(vehicle,segment){
        if (vehicle && segment) {
            var distance = vehicle.getLookAheadDistance();
            return JSVTS.Mover.Map.AreVehiclesWithinDistance(vehicle,segment,distance);
        }else {
            console.log("vehicle: "+vehicle+"; segment: "+segment);
        }
        
        return null;
    },
    ShouldStopForLight: function(vehicle,segment) {
        if (vehicle && segment) {
            var distance = vehicle.getLookAheadDistance();
            return JSVTS.Mover.Map.AreTfcsWithinDistance(vehicle,segment,distance);
        }else {
            console.log("vehicle: "+vehicle+"; segment: "+segment);
        }
        
        return null;
    },
    GetDistanceBetweenTwoPoints: function (p1, p2) {
        return new THREE.Line3(new THREE.Vector3().copy(p1), new THREE.Vector3().copy(p2)).distance();
    }
}