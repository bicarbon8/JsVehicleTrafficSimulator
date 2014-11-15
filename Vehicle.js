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
function Vehicle(vehicle){
    this.Id=null;
    try{
        this.Id=VEH_ID_COUNT++;
    } catch(e){
        this.Id=0;
    }
    this.Name=null;
    this.Width=0;
    this.Height=0;
    this.Location=new Point(0,0);
    this.Velocity=0; // meters per second
    this.Heading=0;
    this.DesiredVelocity = 0;
    this.changingLanes = false;
    this.changeLaneTime = 0;

    this.Initialize=function(vehicle) {
        if (vehicle){
            this.Id=vehicle.Id;
            this.Name=vehicle.Name;
            this.Width=vehicle.Width;
            this.Height=vehicle.Height;
            this.Location=vehicle.Location;
            this.Velocity=vehicle.Velocity;
        }
    }

    this.IntersectsPoint=function(point){
        var intersects=false;
        var rect=this.GetBoundingBox();
        if(rect.ContainsPoint(point)){
            intersects=true;
        }
        return intersects;
    }

    this.GetBoundingBox=function(){
        var rect=null;
        if(this.Width>0 && this.Height>0){
            rect=new Rectangle(this.Width,this.Height);
            rect.Rotate(this.Heading);
            rect.MoveTo(this.Location);
        }
        return rect;
    }

    this.GetViewArea=function(){
        /**
         * the view area is a pie-shaped region where the point of the
         * pie starts from the centrepoint of the vehicle and the crust
         * is ahead and to the sides.  Use 3 triangle to represent this
         * where vehicles in the two side triangles must be traveling 
         * towards the vehicle to initiate slowing
         */
        var tri=null;
        if(this.Location){
            var triP0=this.GetBoundingBox().GetCenterPoint();
            var triP1=new Point(triP0.X,triP0.Y);
            if(this.Velocity>=0.44){
                triP1.MoveBy(new Point(this.Width+(this.Velocity),-(this.Height*2))); //-((this.Height+this.Velocity)/(this.Velocity/4))));
            } else{
                triP1.MoveBy(new Point(this.Width,-this.Height));
            }
            var triP2=new Point(triP0.X,triP0.Y);
            if(this.Velocity>=0.44){
                triP2.MoveBy(new Point(this.Width+(this.Velocity),(this.Height*2))); //((this.Height+this.Velocity)/(this.Velocity/4))));
            } else{
                triP2.MoveBy(new Point(this.Width,this.Height));
            }
            var tri=new Triangle(triP0,triP1,triP2);
            tri.Rotate(this.Heading,triP0);
        }
        return tri;
    }

    this.GetLookAheadDistance=function() {
        if(this.Velocity>=4.4704){
            // distance is one car length per 10 miles per hour
            return (this.Width*(this.ConvertMetersPerSecondToMilesPerHour(this.Velocity)/10))+(this.Width/2);
        } else{
            // or slightly more than half a car length if going really slow
            return this.Width+(this.Width/2);
        }
    }

    this.ConvertMetersPerSecondToMilesPerHour=function(metersPerSec){
        var milesPerHour=0;
        var METERS_PER_MILE=1609.344;
        var SECONDS_PER_HOUR=3600;
        
        milesPerHour = ((metersPerSec/METERS_PER_MILE)*SECONDS_PER_HOUR);
        return milesPerHour;
    }

    // configure this object if data was passed in
    this.Initialize(vehicle);
}