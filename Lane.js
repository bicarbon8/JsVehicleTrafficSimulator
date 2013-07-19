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
function Lane(){
    this.Id=null;
    try{
        this.Id="lane_"+LANE_ID_COUNT++;
    } catch(e){
        this.Id="lane_"+0;
    }
    this.Name=null;
    this.Segments=[];

    this.Beginning=function(){
        var beginning=null;
        if(this.Segments.length>0){
            beginning=this.Segments[0].Start;
        }
        return beginning;
    }

    this.End=function(){
        var end=null;
        if(this.Segments.length>0){
            end=this.Segments[this.Segments.length-1].End;
        }
        return end;
    }

    this.ContainsStartPoint=function(point){
        for(var i=0;i<this.Segments.length;i++){
            if(this.Segments[i].ContainsStartPoint(point)){
                contains=true;
                return true;
            }
        }
        return false;
    }

    this.IsLastSegmentIndex=function(index) {
        if (this.Segments) {
            if (this.Segments.length > index+1) {
                return false;
            }
        }
        return true;
    }

    this.AddVehicle=function(vehicle) {
        // push the vehicle on to the first segment of this lane
        var firstSegment = this.Segments[0];
        if (firstSegment) {
            firstSegment.AddVehicle(vehicle);
        }
    }

    this.GetStopLights=function() {
        var lights = [];

        for (var i=0; i<this.Segments.length; i++) {
            var segment = this.Segments[i];
            var segLights = segment.StopLights;
            for (var j=0; j<segLights.length; j++) {
                lights.push(segLights[j]);
            }
        }

        return lights;
    }

    this.GetVehicles=function() {
        var vehicles = [];

        for (var i=0; i<this.Segments.length; i++) {
            var segment = this.Segments[i];
            var segVehicles = segment.Vehicles;
            for (var j=0; j<segVehicles.length; j++) {
                vehicles.push(segVehicles[j]);
            }
        }

        return vehicles;
    }
}