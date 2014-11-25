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
    move: function(elapsedMilliseconds, map){
        JSVTS.Mover.Map = map;
        var fulfilled = 0;
        var segments = JSVTS.Mover.Map.GetSegments();
        // loop through each Vehicle
        var vehicles = JSVTS.Mover.Map.GetVehicles();
        for (var m in vehicles) {
            var v = vehicles[m];
            // only move the vehicles we're interested in
            var segment = map.GetSegmentById(v.segmentId);
            var speed=v.velocity;
            if(elapsedMilliseconds>0){
                var IsStopping=false;
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
                        v.segmentId = undefined;

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
                            delete JSVTS.Mover.Map._vehicles[v.Id];
                            JSVTS.Controller.plotter.scene.remove(v.mesh);
                            v = null;
                        }
                    } else {
                        t = distTraveled / length;
                    }

                    if (seg && v) {
                        // set the vehicle position
                        var pt = seg.getPoint(t);
                        v.updateLocation(pt);
                    }
                        
                    var bypassLaneCompare = false;

                    // check for vehicles in range
                    if (JSVTS.Mover.ShouldStopForVehicles(v,segment)) {
                        // check for alternate lanes to move to
                        // var currentSegment = segment;
                        // var availableLane = JSVTS.Mover.AvailableLane(v,currentSegment);
                        
                        // if (availableLane) { // TODO: driver decides to change lanes or not
                        //     v.changingLanes = true;
                        //     bypassLaneCompare = true; // first time through

                        //     // set vehicle's heading towards new lane
                        //     v.config.heading = JSVTS.Mover.GetHeadingToNewLane(v,availableLane);

                        //     // switch ownership to new lane
                        //     v.segmentId = availableLane.Id;
                        // }

                        // // begin stopping for Vehicles (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
                        IsStopping=true;
                    } else if (JSVTS.Mover.ShouldStopForLight(v,segment)) { // and then check for traffic lights in range
                        // begin stopping for Traffic Light (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
                        IsStopping=true;
                    } else { // and finally check for cornering in range
                        var headingDiff = JSVTS.Mover.ShouldSlowDown(v,segment);
                        if (headingDiff !== 0) {
                            var corneringSpeed = JSVTS.Mover.CorneringSpeedCalculator(headingDiff);
                        
                            // begin slowing down (-15ft/s^2); 60mph (88f/s) takes 140ft to stop, but don't fully stop
                            if (v.velocity > (v.config.desiredVelocity*corneringSpeed)) {
                                IsStopping=true;
                            }
                        }
                    }

                    // if (v.changingLanes) {
                    //     // change our offset to move towards new lane
                    //     offset = JSVTS.Mover.GetXYFromDistHeading(distTraveled,v.config.heading);
                    //     nextPoint=new THREE.Vector3(v.config.location.x+offset.x,v.config.location.y+offset.y,v.config.location.z+offset.z);

                    //     // reset heading if in lane
                    //     var carBounds = v.GetBoundingBox();
                    //     for (var i=0; i<4; i++) {
                    //         var start = i;
                    //         var end = i+1;
                    //         if (end>=4) {
                    //             end = 0;
                    //         }
                    //         var line = new THREE.Line3(carBounds.Points[start], carBounds.Points[end]);
                    //         if (segment.IntersectsLine(carBounds) && !bypassLaneCompare){
                    //             v.config.heading = segment.heading;
                    //             v.changingLanes = false;
                    //         }
                    //     }
                    // }

                    // // ensure we don't move past the end of a segment
                    // if(JSVTS.Mover.IsBeyondCurrentSegment(v,segment)){
                    //     var beyondDist=JSVTS.Mover.GetDistanceBetweenTwoPoints(v.config.location,
                    //         segment.config.end);
                        
                    //     // remove vehicle from current segment
                    //     v.segmentId = undefined;

                    //     // if there is a next Segment
                    //     var nextSegments = JSVTS.Mover.Map.GetSegmentsStartingAt(segment.config.end);
                    //     if(nextSegments && nextSegments.length > 0){
                    //         // move to segment (pick randomly)
                    //         var randIndex = Math.floor((Math.random()*nextSegments.length));
                    //         v = nextSegments[randIndex].AttachVehicle(v);
                    //         var offset=JSVTS.Mover.GetXYFromDistHeading(beyondDist,nextSegments[randIndex].heading);
                    //         nextPoint=new THREE.Vector3(v.config.location.x+offset.x,v.config.location.y+offset.y,v.config.location.z+offset.z);
                    //     } else{
                    //         // remove v from the Simulation
                    //         delete JSVTS.Mover.Map._vehicles[v.Id];
                    //     }
                    // }

                    // v.updateLocation(new THREE.Vector3(nextPoint.x, nextPoint.y, nextPoint.z));
                }
                if(v){
                    // speed up or slow down
                    if(v.velocity<v.config.desiredVelocity && !IsStopping){
                        // speed up: avg. rate of acceleration is 3.5 m/s^2
                        if(v.config.desiredVelocity-v.velocity<0.1){
                            // close enough so just set to value
                            v.velocity=v.config.desiredVelocity;
                            v.mesh.material.color.setHex(0xffffff);
                        } else{
                            // accelerate
                            v.velocity+=(3.5*elapsedSeconds);
                            v.mesh.material.color.setHex(0x66ff66);
                        }
                    }
                    if(v.velocity>v.config.desiredVelocity || IsStopping){
                        // slow down: avg. rate of decceleration is 3.5 m/s^2
                        if(v.velocity-v.config.desiredVelocity<0.1 && !IsStopping){
                            // close enough so just set to value
                            v.velocity=v.config.desiredVelocity;
                            v.mesh.material.color.setHex(0xffffff);
                        } else{
                            // deccelerate
                            v.velocity-=(3.5*elapsedSeconds);
                            v.mesh.material.color.setHex(0xff0000);
                        }
                        
                        // prevent going backwards
                        if(v.velocity<0){
                            v.velocity=0.44704;
                            v.mesh.material.color.setHex(0x66ff66);
                        }
                    }
                }
            }
        }
            
        JSVTS.Mover.TotalElapsedTime+=elapsedMilliseconds;
    },
    ConvertMilesPerHourToMetersPerSecond: function(milesPerHour){
        var metersPerSec=0;
        var METERS_PER_MILE=1609.344;
        var SECONDS_PER_HOUR=3600;
        
        metersPerSec = ((milesPerHour*METERS_PER_MILE)/SECONDS_PER_HOUR);
        return metersPerSec;
    },
    ConvertMetersPerSecondToMilesPerHour: function(metersPerSec){
        var milesPerHour=0;
        var METERS_PER_MILE=1609.344;
        var SECONDS_PER_HOUR=3600;
        
        milesPerHour = ((metersPerSec/METERS_PER_MILE)*SECONDS_PER_HOUR);
        return milesPerHour;
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
    GetXYFromDistHeading: function(distance,heading){
        var x=Math.cos(heading)*distance;
        var y=Math.sin(heading)*distance;
        var z=Math.sin(heading)*distance;
        return new THREE.Vector3(x,y,z);
    },
    ShouldSlowDown: function(vehicle,segment){
        // slow down when the next segment is in range and has a different heading
        // base the amount on how different the heading is
        var headingDiff = 0;
        var distance = vehicle.getLookAheadDistance();
        var distToSegEnd = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location,segment.config.end);
        // if we can see past the end of this segment
        if (distToSegEnd < distance) {
            // then check the heading of the next segment(s)
            var nextSegments = JSVTS.Mover.Map.GetSegmentsStartingAt(segment.config.end);
            for (var i=0; i<nextSegments.length; i++) {
                // get the largest heading difference
                var tmp = Math.abs(segment.heading - nextSegments[i].heading);
                if (tmp > headingDiff) {
                    headingDiff = tmp;
                }
            }
        }

        return headingDiff; // don't slow down
    },
    CorneringSpeedCalculator: function(headingDifference) {
        if (headingDifference < 12) {
            // no real difference
            return 1;
        }
        if (headingDifference < 25) {
            // mild / gentle curve
            return 0.9;
        }
        if (headingDifference < 45) {
            return 0.75;
        }
        if (headingDifference < 90) {
            return 0.5;
        }
        if (headingDifference < 135) {
            return 0.25;
        }
        if (headingDifference >= 135) {
            return 0.175;
        }
    },
    ShouldStopForVehicles: function(vehicle,segment){
        if (vehicle && segment) {
            var distance = vehicle.getLookAheadDistance();
            if (JSVTS.Mover.Map.AreVehiclesWithinDistance(vehicle,segment,distance)) {
                return true;
            }
        }else {
            console.log("vehicle: "+vehicle+"; segment: "+segment);
        }
        
        return false;
    },
    ShouldStopForLight: function(vehicle,segment) {
        return false;
        // var distance = vehicle.getLookAheadDistance();
        // var stoplights = JSVTS.Mover.Map.GetStopLightsWithinDistance(vehicle.config.location,segment,distance);
        // // check for stoplights
        // for(var i=0;i<stoplights.length;i++){
        //     var l=stoplights[i];
        //     if(l.GetState(JSVTS.Mover.TotalElapsedTime/1000)==new StopLightState().yellow || 
        //         l.GetState(JSVTS.Mover.TotalElapsedTime/1000)==new StopLightState().Red){
        //         return true;
        //     }
        // }

        // return false;
    },
    IsBeyondCurrentSegment: function(vehicle,segment){
        // create Ray looking backwards and see if it intersects with end of segment
        var sphere = THREE.Sphere(new THREE.Vector3().copy(segment.config.end), 1);
        var backRay = THREE.Ray(new THREE.Vector3().copy(vehicle.confic.location), new THREE.Vector3().copy(vehicle.previousLocation).normalize());
        return backRay.isIntersectionSphere(sphere);
    },
    GetDistanceBetweenTwoPoints: function(p1,p2){
        return new THREE.Line3(new THREE.Vector3().copy(p1), new THREE.Vector3().copy(p2)).distance();
    }
}