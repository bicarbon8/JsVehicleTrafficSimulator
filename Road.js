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
function Road(){
    this.Name=null;
    this.Lanes=new Array();
    this.AddLane=function(lane){
        lane.Road=this;
        this.Lanes.push(lane);
    }
    this.GetVehicles=function(){
        var vehicles=new Array();
        for(var i=0;i<this.Lanes.length;i++){
            var lane = this.Lanes[i];
            for(var j=0;j<lane.Segments.length;j++){
                var segment = lane.Segments[j];
                for (var k=0; k<segment.Vehicles.length; k++) {
                    var vehicle = segment.Vehicles[k];
                    vehicles.push(vehicle);
                }
            }
        }
        return vehicles;
    }
    this.ContainsStartPoint=function(point){
        for(var i=0;i<this.Lanes.length;i++){
            if(this.Lanes[i].ContainsStartPoint(point)){
                contains=true;
                return true;
            }
        }
        return false;
    }
}