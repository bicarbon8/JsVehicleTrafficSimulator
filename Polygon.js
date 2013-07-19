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
function Polygon() {
	this.Points = [];

	this.Sign=function(p1,p2,p3) {
        return (p1.X-p3.X)*(p2.Y-p3.Y)-(p2.X-p3.X)*(p1.Y-p3.Y);
    }

    this.ContainsPoint=function(point){
        // loop through each point
        var boolArray = [];
        for (var i=0; i<this.Points.length; i++) {
        	var i2 = i+1;
        	// ensure we wrap back around to the beginning point
        	if (i2>=this.Points.length) {
        		i2 = 0;
        	}

        	boolArray.push((this.Sign(point,this.Points[i],this.Points[i2]) < 0));
        }

        var result = boolArray[0];
        for (var i=1; i<boolArray.length; i++) {
        	if (result != boolArray[i]) {
        		return false;
        	}
        }

        return true;
    }

    this.IntersectsLine=function(line) {
        // make line segments from each sequence of points
        for (var i=0; i<this.Points.length; i++) {
            var p1 = this.Points[i];
            var p2 = this.Points[i+1];
            if (i+1 > this.Points.length-1) {
                p2 = this.Points[0]; // connect to starting point
            }

            var lineSegment = new Line(p1,p2);

            if (lineSegment.IntersectsLine(line)) {
                return true;
            }
        }

        return false;
    }

    this.MoveTo=function(point){
        for(var i=0;i<this.Points.length;i++){
            // get the distance from passed in point to current Location and offset by that amount
            var xOffset = point.X-this.Location.X;
            var yOffset = point.Y-this.Location.Y;
            var zOffset = point.Z-this.Location.Z;
            this.Points[i].MoveBy(new Point(xOffset,yOffset,zOffset));
        }
        this.Location=point;
    }

    this.Rotate=function(degrees,center) {
        if(!center) {
            center = new Point(0,0,0);
        }

        for(var i=0;i<this.Points.length;i++) {
            this.Points[i].Rotate(degrees,center);
        }
    }

    this.GetCenterPoint=function() {
        var xSum=0;
        var ySum=0;
        var zSum=0;

        if (this.Points && this.Points.length > 0) {
            for (var i=0; i<this.Points.length; i++) {
                xSum+=this.Points[i].X;
                ySum+=this.Points[i].Y;
                zSum+=this.Points[i].Z;
            }

            var xAvg = xSum/this.Points.length;
            var yAvg = ySum/this.Points.length;
            var zAvg = zSum/this.Points.length;
        }

        return new Point(xAvg,yAvg,zAvg);
    }
}