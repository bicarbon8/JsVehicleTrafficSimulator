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
function Segment(start,end){
    this.InheritFrom=Line;
    this.InheritFrom();
    this.Id=null;
    this._stopLights=[];
    this.SpeedLimit=0;
    this.Preference=0; // values used to more heavily weight a choice of this segment
    this.IsInlet=false; // values used to determine which segments can have vehicles appear
    this.RoadName=null; // segments that are part of the same road are available for lane changes
    this.LaneChangeLines=[];

    this.Initialize=function(start,end) {
        this.SetPoints(start,end);

        // build the "tendrils" that allow for lane changes
        this.GenerateLaneChangeLines();
    }

    try{
        this.Id="segment_"+SEG_ID_COUNT++;
    } catch(e){
        this.Id="segment_"+0;
    }
    
    this.AttachVehicle=function(vehicle) {
        // set the vehicle's heading
        vehicle.Heading = this.Heading();
        vehicle.DesiredVelocity = this.SpeedLimit;
        vehicle.Location = this.Start;
        vehicle.SegmentId = this.Id;

        return vehicle;
    }

    this.GetStopLights=function() {
        return this._stopLights;
    }

    this.AddStoplight=function(stoplight) {
        this._stopLights.push(stoplight);
    }

    this.GenerateLaneChangeLines=function() {
        var distance = 5; // separate lines by this much distance of segment
        var length = this.GetLength();
        var heading = this.Heading();
        var alternator = -1;

        for (var i=0; i<length; i+=distance) {
            var x1=Math.cos(heading*(Math.PI/180))*i;
            var y1=Math.sin(heading*(Math.PI/180))*i;
            var x2=Math.cos(heading*(Math.PI/180))*(i+(distance*2));
            var y2=Math.sin(heading*(Math.PI/180))*(i+(distance*2));
            var p1 = new Point(this.Start.X,this.Start.Y);
            p1.MoveBy(new Point(x1,y1));
            var p2 = new Point(this.Start.X,this.Start.Y);
            p2.MoveBy(new Point(x2,y2));
            
            var line = new Line(p1, p2);
            // rotate to 90 and -90 alternating each step
            line.Rotate((90*alternator), p1);
            alternator*=-1; // reverse polarity

            this.LaneChangeLines.push(line);
        }
    }

    this.Initialize(start, end);
}