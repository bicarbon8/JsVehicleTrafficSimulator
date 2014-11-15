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
	"Point.js",
	"Line.js",
	"Polygon.js", 
	"Rectangle.js",
	"Triangle.js",
	"Driver.js",
	"Vehicle.js", 
	"Segment.js",
	"GraphMap.js");
onmessage = function(event) {
	var data = JSON.parse(event.data);
	var map = new GraphMap(data.map.Scale);
	var keys = Object.keys(data.map._segments);
	for (var i in keys) {
		var segs = data.map._segments[keys[i]];
		for (var k in segs) {
			var seg = segs[k];
			var segment = new Segment(seg.Start, seg.End);
			for (var j in seg._vehicles) {
				var veh = seg._vehicles[j];
				var vehicle = new Vehicle(veh);
				segment._vehicles.push(vehicle);
			}
		}
		map.AddSegment(segment);
	}
	WorkerMover.Move(data.vehicleId, data.elapsedMilliseconds, map);
}
var WorkerMover = {
	Map: undefined,
    TotalElapsedTime: 0,
    ChangeLaneDelay: 15000, // don't change lanes for 15 seconds after a change
    Move: function(vehicleId, elapsedMilliseconds, map){
    	WorkerMover.Map = map;
    	var vehicle = undefined;
        // move everything the desired number of steps
        var segments = WorkerMover.Map.GetSegments();
        // loop through each Segment
        for (var l=0; l<segments.length; l++) {
            // move the vehicles on this segment
            for (var m=0; m<segments[l].GetVehicles().length; m++) {
                var v = segments[l].GetVehicles()[m];
                if (v.Id == vehicleId) {
	                var speed=WorkerMover.ConvertMilesPerHourToMetersPerSecond(v.Velocity);
	                var elapsedMilliseconds=WorkerMover.MillisecStep;
	                if(elapsedMilliseconds>0){
	                    var IsStopping=false;
	                    var elapsedSeconds=(elapsedMilliseconds/1000);
	                    var distTraveled=(speed*elapsedSeconds);
	                    if(distTraveled>0){
	                        var offset=WorkerMover.GetXYFromDistHeading(distTraveled,segments[l].Heading());
	                        var nextPoint=new Point(v.Location.X+offset.X,v.Location.Y+offset.Y);
	                        var bypassLaneCompare = false;

	                        // check for vehicles in range
	                        if (WorkerMover.ShouldStopForVehicles(v,segments[l])) {
	                            // check for alternate lanes to move to
	                            var currentSegment = segments[l];
	                            var availableLane = WorkerMover.AvailableLane(v,currentSegment);
	                            
	                            if (availableLane && (v.changeLaneTime+WorkerMover.ChangeLaneDelay<=WorkerMover.TotalElapsedTime)) { // wait 10 seconds before changing lanes
	                                v.changingLanes = true;
	                                v.changeLaneTime = WorkerMover.TotalElapsedTime;
	                                bypassLaneCompare = true; // first time through

	                                // set vehicle's heading towards new lane
	                                v.Heading = WorkerMover.GetHeadingToNewLane(v,availableLane);

	                                // switch ownership to new lane
	                                segments[l].GetVehicles().splice(m,1);
	                                availableLane._vehicles.push(v);
	                            }

	                            // begin stopping for Vehicles (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
	                            v.Velocity-=(14*elapsedSeconds);
	                            IsStopping=true; 
	                        } else if (WorkerMover.ShouldStopForLight(v,segments[l])) { // and then check for traffic lights in range
	                            // begin stopping for Traffic Light (-15ft/s^2); 60mph (88f/s) takes 140ft to stop
	                            v.Velocity-=(14*elapsedSeconds);
	                            IsStopping=true;
	                        } else { // and finally check for cornering in range
	                            var headingDiff = WorkerMover.ShouldSlowDown(v,segments[l]);
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
	                            var carLoc = v.Location;
	                            if (segments[l].ContainsPoint(carLoc) && !bypassLaneCompare){
	                                v.Heading = segments[l].Heading();
	                                v.changingLanes = false;
	                            }
	                        }

	                        v.Location=nextPoint;
	                        // ensure we don't move past the end of a segment
	                        if(WorkerMover.IsBeyondCurrentSegment(v,segments[l])){
	                            var beyondDist=WorkerMover.GetDistanceBetweenTwoPoints(v.Location,
	                                segments[l].End);
	                            
	                            // remove vehicle from current segment
	                            segments[l].GetVehicles().splice(m,1);

	                            // if there is a next Segment
	                            var nextSegments = WorkerMover.Map.GetSegmentsStartingAt(segments[l].End);
	                            if(nextSegments && nextSegments.length > 0){
	                                // move to segment (pick randomly)
	                                var randIndex = Math.floor((Math.random()*nextSegments.length));
	                                nextSegments[randIndex].AddVehicle(v);
	                                var offset2=WorkerMover.GetXYFromDistHeading(beyondDist,segments[randIndex].Heading());
	                                v.Location=new Point(v.Location.X+offset2.X,v.Location.Y+offset2.Y);
	                            } else{
	                                // remove v from the Simulation
	                                v = null;
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
	                vehicle = v;
	                break;
	            }
            }
            if (vehicle) {
            	break;
            }
        }
            
        var message = JSON.stringify(map.GetVehicles());
        postMessage(message);
    },
    ConvertMilesPerHourToMetersPerSecond: function(milesPerHour){
        var metersPerSec=0;
        var METERS_PER_MILE=1609.344;
        var SECONDS_PER_HOUR=3600;
        
        metersPerSec = ((milesPerHour*METERS_PER_MILE)/SECONDS_PER_HOUR);
        return metersPerSec;
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
                var altCars = alt.GetVehicles();
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
    },
    LocateSegmentAndAttachVehicle: function(vehicle,location){
        var loc=location;
        for(var i=0;i<WorkerMover.Map.Roads.length;i++){
            if(WorkerMover.Map.Roads[i].ContainsStartPoint(loc)){
                for(var j=0;j<WorkerMover.Map.Roads[i].Lanes.length;j++){
                    if(WorkerMover.Map.Roads[i].Lanes[j].ContainsStartPoint(loc)){
                        for(var k=0;k<WorkerMover.Map.Roads[i].Lanes[j].Segments.length;k++){
                            if(WorkerMover.Map.Roads[i].Lanes[j].Segments[k].ContainsStartPoint(loc)){
                                WorkerMover.Map.Roads[i].Lanes[j].Segments[k].AddVehicle(vehicle);
                                return null;
                            }
                        }
                    }
                }
            }
        }
    }
}