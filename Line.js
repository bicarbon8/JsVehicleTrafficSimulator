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
function Line(startPoint, endPoint) {
	this.Start=startPoint; // Point
    this.End=endPoint; // Point

    this.SetPoints=function(startPoint, endPoint) {
    	this.Start = startPoint;
    	this.End = endPoint;
    }

    this.Heading=function(){
        var heading=0;
        if(this.Start!=null && this.End!=null){
            var y=(this.End.Y-this.Start.Y);
            var x=(this.End.X-this.Start.X);
            var radians=Math.atan2(y,x);
            heading=(radians*(180/Math.PI));
        }
        
        return heading;
    }

    this.ContainsStartPoint=function(point){
        if(this.Start.Equals(point)){
            return true;
        }
        return false;
    }

    this.ContainsEndPoint=function(point) {
        if (this.End.Equals(point)) {
            return true;
        }

        return false;
    }

    this.Rotate=function(degrees,center) {
        this.Start.Rotate(degrees,center);
        this.End.Rotate(degrees,center);
    }

    this.IntersectsLine=function(line) {
    	if (line && line.Start && line.End) {
            var p0x = this.Start.X;
            var p0y = this.Start.Y;
            var p1x = this.End.X;
            var p1y = this.End.Y;

            var p2x = line.Start.X;
            var p2y = line.Start.Y;
            var p3x = line.End.X;
            var p3y = line.End.Y;

            var s1x = p1x-p0x;
            var s1y = p1y-p0y;
            var s2x = p3x-p2x;
            var s2y = p3y-p2y;

            var s = (-s1y * (p0x-p2x) + s1x * (p0y-p2y)) / (-s2x * s1y + s1x * s2y);
            var t = (s2x * (p0y-p2y) - s2y * (p0x-p2x)) / (-s2x * s1y + s1x * s2y);

            if (s>=0 && s<=1 && t>=0 && t<=1) {
                return true;
            }
    	} 

    	return false; // no intersection found
    }

    this.ContainsPoint=function(point) {
        if (this.ContainsStartPoint(point) || this.ContainsEndPoint(point)) {
            return true;
        } 

        // create a line from this.Start to point and compare headings
        var line = new Line(this.Start,point);
        var inputHeading = line.Heading();
        var thisHeading = this.Heading();
        var inputLength = line.GetLength();
        var thisLength = this.GetLength();
        var maxHeading = Math.max(inputHeading,thisHeading);
        var minHeading = Math.min(inputHeading,thisHeading);
        if ((maxHeading-minHeading <= 0.05) && inputLength <= thisLength) {
            return true;
        }

        return false;
    }

    this.GetLength=function() {
        return Math.sqrt(Math.pow(this.End.X-this.Start.X,2)+Math.pow(this.End.Y-this.Start.Y,2));
    }
}