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
importScripts(
    "ext/threejs-69.min.js",
	"js/objects/vehicle.js", 
	"js/objects/segment.js",
	"js/graphmap.js");
var elapsed = new Date().getTime();
onmessage = function(event) {
	var data = JSON.parse(event.data);
	var map = new JSVTS.GraphMap(data.map.Scale);
	var keys = Object.keys(data.map._segments);
	for (var i in keys) {
		var segArray = data.map._segments[keys[i]];
		segArray.forEach(function (segment) {
			var newSeg = new Segment(segment.Start, segment.End);
			newSeg.Id = segment.Id;
			newSeg.SpeedLimit = segment.SpeedLimit;
			map.AddSegment(newSeg);
		});
	}
	keys = Object.keys(data.map._vehicles);
	for (var i in keys) {
		var v = data.map._vehicles[keys[i]];
		var newVeh = new Vehicle(v);
		map._vehicles[newVeh.Id] = newVeh;
	}
    elapsed = new Date().getTime() - elapsed;
	WorkerMover.Move(data.vehicleIds, elapsed, map);
}
var WorkerMover = {
	Map: undefined,
    TotalElapsedTime: 0,
    ChangeLaneDelay: 15000, // don't change lanes for 15 seconds after a change
    Move: function(vehicleIds, elapsedMilliseconds, map){
    	WorkerMover.Map = map;
    	var fulfilled = 0;
        var segments = WorkerMover.Map.GetSegments();
        // loop through each Vehicle
        for (var m=0; m<WorkerMover.Map.GetVehicles().length; m++) {
            var v = WorkerMover.Map.GetVehicles()[m];
            // only move the vehicles we're interested in
            if (vehicleIds.indexOf(v.Id) > -1) {
            	var segment = map.GetSegmentById(v.SegmentId);
                var speed=WorkerMover.ConvertMilesPerHourToMetersPerSecond(v.Velocity);
                if(elapsedMilliseconds>0){
                    var IsStopping=false;
                    var elapsedSeconds=(elapsedMilliseconds/1000);
                    var distTraveled=(speed*elapsedSeconds);
                    if(distTraveled>0){
                        var offset=WorkerMover.GetXYFromDistHeading(distTraveled,v.Heading);
                        var nextPoint=new Point(v.Location.X+offset.X,v.Location.Y+offset.Y);
                        var bypassLaneCompare = false;

                        // check for vehicles in range
                        if (WorkerMover.ShouldStopForVehicles(v,segment)) {
                            // check for alternate lanes to move to
                            var currentSegment = segment;
                            var availableLane = WorkerMover.AvailableLane(v,currentSegment);
                            
                            if (availableLane) { // TODO: driver decides to change lanes or not
                                v.changingLanes = true;
                                bypassLaneCompare = true; // first time through

                                // set vehicle's heading towards new lane
                                v.Heading = WorkerMover.GetHeadingToNewLane(v,availableLane);

                                // switch ownership to new lane
                                v.SegmentId = availableLane.Id;
                            }

                            // begin stopping for Vehicles (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
                            v.Velocity-=(14*elapsedSeconds);
                            IsStopping=true; 
                        } else if (WorkerMover.ShouldStopForLight(v,segment)) { // and then check for traffic lights in range
                            // begin stopping for Traffic Light (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
                            v.Velocity-=(14*elapsedSeconds);
                            IsStopping=true;
                        } else { // and finally check for cornering in range
                            var headingDiff = WorkerMover.ShouldSlowDown(v,segment);
                            if (headingDiff != 0) {
                                var corneringSpeed = WorkerMover.CorneringSpeedCalculator(headingDiff);
                            
                                // begin slowing down (-15ft/s^2); 60mph (88f/s) takes 140ft to stop, but don't fully stop
                                if (v.Velocity > (v.DesiredVelocity*corneringSpeed)) {
                                    v.Velocity-=(14*elapsedSeconds);
                                    IsStopping=true;
                                }
                            }
                        }

                        if (v.changingLanes) {
                            // change our offset to move towards new lane
                            offset = WorkerMover.GetXYFromDistHeading(distTraveled,v.Heading);
                            nextPoint=new Point(v.Location.X+offset.X,v.Location.Y+offset.Y);

                            // reset heading if in lane
                            var carBounds = v.GetBoundingBox();
                            for (var i=0; i<4; i++) {
                            	var start = i;
                            	var end = i+1;
                            	if (end>=4) {
                            		end = 0;
                            	}
	                            var line = new Line(carBounds.Points[start], carBounds.Points[end]);
	                            if (segment.IntersectsLine(carBounds) && !bypassLaneCompare){
	                                v.Heading = segment.Heading();
	                                v.changingLanes = false;
	                            }
	                        }
                        }

                        v.Location=nextPoint;
                        // ensure we don't move past the end of a segment
                        if(WorkerMover.IsBeyondCurrentSegment(v,segment)){
                            var beyondDist=WorkerMover.GetDistanceBetweenTwoPoints(v.Location,
                                segment.End);
                            
                            // remove vehicle from current segment
                            v.SegmentId = undefined;

                            // if there is a next Segment
                            var nextSegments = WorkerMover.Map.GetSegmentsStartingAt(segment.End);
                            if(nextSegments && nextSegments.length > 0){
                                // move to segment (pick randomly)
                                var randIndex = Math.floor((Math.random()*nextSegments.length));
                                v = nextSegments[randIndex].AttachVehicle(v);
                                var offset2=WorkerMover.GetXYFromDistHeading(beyondDist,nextSegments[randIndex].Heading());
                                v.Location=new Point(v.Location.X+offset2.X,v.Location.Y+offset2.Y);
                            } else{
                                // remove v from the Simulation
                                delete WorkerMover.Map._vehicles[v.Id];
                            }
                        }
                    }
                    if(v && !IsStopping){
                        // speed up or slow down
                        if(v.Velocity<v.DesiredVelocity){
                            // speed up: avg. rate of acceleration is 3.5 m/s^2
                            if(v.DesiredVelocity-v.Velocity<0.1){
                                // close enough so just set to value
                                v.Velocity=v.DesiredVelocity;
                            } else{
                                // accelerate
                                v.Velocity+=(3.5*elapsedSeconds);
                            }
                        }
                        if(v.Velocity>v.DesiredVelocity){
                            // slow down: avg. rate of decceleration is 3.5 m/s^2
                            if(v.Velocity-v.DesiredVelocity<0.1){
                                // close enough so just set to value
                                v.Velocity=v.DesiredVelocity;
                            } else{
                                // deccelerate
                                v.Velocity-=(3.5*elapsedSeconds);
                            }
                            
                            // prevent going backwards
                            if(v.Velocity<0){
                                v.Velocity=0.44704;
                            }
                        }
                    }
                }
                v.ElapsedMs=WorkerMover.TotalElapsedTime+elapsedMilliseconds;
                var message = JSON.stringify(v);
    			postMessage(message);
    			fulfilled++;
    			if (fulfilled === vehicleIds.length) {
    				break;
    			}
            }
        }
            
        WorkerMover.TotalElapsedTime+=elapsedMilliseconds;
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
            var alternateLanes = WorkerMover.Map.GetSimilarSegmentsInRoad(currentSegment);
            for (var p=0; p<alternateLanes.length; p++) {
                var alt = alternateLanes[p];
                var altCars = WorkerMover.Map.GetVehiclesInSegment(v.SegmentId);
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
        var heading = v.Heading;

        var laneTendrils = availableLane.LaneChangeLines;
        var carViewArea = v.GetViewArea();
        for (var i=laneTendrils.length-1; i>=0; i--) {
            var laneTendril = laneTendrils[i];
            
            if (carViewArea.IntersectsLine(laneTendril)) {
                var headingLine = new Line(v.Location,laneTendril.Start);
                return headingLine.Heading();
            }
        }

        return heading;
    },
    GetXYFromDistHeading: function(distance,heading){
        var x=Math.cos(heading*(Math.PI/180))*distance;
        var y=Math.sin(heading*(Math.PI/180))*distance;
        return new Point(x,y);
    },
	ShouldSlowDown: function(vehicle,segment){
        // slow down when the next segment is in range and has a different heading
        // base the amount on how different the heading is
        var headingDiff = 0;
        var distance = vehicle.GetLookAheadDistance();
        var distToSegEnd = new Line(vehicle.Location,segment.End).GetLength();
        // if we can see past the end of this segment
        if (distToSegEnd < distance) {
            // then check the heading of the next segment(s)
            var nextSegments = WorkerMover.Map.GetSegmentsStartingAt(segment.End);
            for (var i=0; i<nextSegments.length; i++) {
                // get the largest heading difference
                var tmp = Math.abs(segment.Heading() - nextSegments[i].Heading());
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
        var distance = vehicle.GetLookAheadDistance();
        if (WorkerMover.Map.AreVehiclesWithinDistance(vehicle,segment,distance)) {
            return true;
        }
        
        return false;
    },
	ShouldStopForLight: function(vehicle,segment) {
        var distance = vehicle.GetLookAheadDistance();
        var stoplights = WorkerMover.Map.GetStopLightsWithinDistance(vehicle.Location,segment,distance);
        // check for stoplights
        for(var i=0;i<stoplights.length;i++){
            var l=stoplights[i];
            if(l.GetState(WorkerMover.TotalElapsedTime/1000)==new StopLightState().Yellow || 
                l.GetState(WorkerMover.TotalElapsedTime/1000)==new StopLightState().Red){
                return true;
            }
        }

        return false;
    },
	IsBeyondCurrentSegment: function(vehicle,segment){
        var currentSegment=segment;
        var xDif=currentSegment.Start.X-currentSegment.End.X;
        var yDif=currentSegment.Start.Y-currentSegment.End.Y;
        if(xDif==0){
            // horizontal line
            if(currentSegment.Start.Y<currentSegment.End.Y){
                if(vehicle.Location.Y>currentSegment.End.Y){
                    return true;
                }
            } else{
                if(vehicle.Location.Y<currentSegment.End.Y){
                    return true;
                }
            }
        } else{
            if(yDif==0){
                // vertical line
                if(currentSegment.Start.X<currentSegment.End.X){
                    if(vehicle.Location.X>currentSegment.End.X){
                        return true;
                    }
                } else{
                    if(vehicle.Location.X<currentSegment.End.X){
                        return true;
                    }
                }
            } else{
                if(Math.abs(xDif)>Math.abs(yDif)){
                    if(currentSegment.Start.X<currentSegment.End.X){
                        if(vehicle.Location.X>currentSegment.End.X){
                            return true;
                        }
                    } else{
                        if(vehicle.Location.X<currentSegment.End.X){
                            return true;
                        }
                    }
                } else{
                    if(currentSegment.Start.Y<currentSegment.End.Y){
                        if(vehicle.Location.Y>currentSegment.End.Y){
                            return true;
                        }
                    } else{
                        if(vehicle.Location.Y<currentSegment.End.Y){
                            return true;
                        }
                    }
                }
            }
        }
        return false; // still on the current segment
    },
    GetDistanceBetweenTwoPoints: function(p1,p2){
        return Math.sqrt(Math.pow((p2.X-p1.X),2)+Math.pow((p2.Y-p1.Y),2));
    }
}