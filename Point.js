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
function Point(x,y,z){
    this.X=x;
    this.Y=y;
    this.Z=z;

    /**
     * Rotate using default axis of Z
     * @param {int} degrees the number of degrees to rotate about the default axis (Z)
     * @param {Point} center  the center point to rotate about
     */
    this.Rotate=function(degrees,center){
        // rotate on the 2 dimensional surface
        this.RotateXYZ(degrees,Axis.Z,center);
    }

    this.RotateXYZ=function(degrees,axis,center) {
        var tmpPoint=null;
        var radians=(degrees/180)*Math.PI;
        if(center){
            // translate to origin
            //V = (Px,Py) - (Ox,Oy) 
            tmpPoint = new Point((this.X-center.X),(this.Y-center.Y),(this.Z-center.Z));
        } else {
            tmpPoint = new Point(this.X, this.Y);
        }

        // rotate about origin on the specified Axis
        switch (axis) {
            case Axis.X:
                //V = (Vz*cos 45° - Vy*sin 45°, Vz*sin 45° + Vy*cos 45°)
                tmpPoint = new Point((tmpPoint.Z*Math.cos(radians))-(tmpPoint.Y*Math.sin(radians)),
                    (tmpPoint.Z*Math.sin(radians))+(tmpPoint.Y*Math.cos(radians)));
                break;
            case Axis.Y:
                //V = (Vz*cos 45° - Vx*sin 45°, Vz*sin 45° + Vx*cos 45°)
                tmpPoint = new Point((tmpPoint.Z*Math.cos(radians))-(tmpPoint.X*Math.sin(radians)),
                    (tmpPoint.Z*Math.sin(radians))+(tmpPoint.X*Math.cos(radians)));
                break;
            case Axis.Z:
            default: 
                //V = (Vx*cos 45° - Vy*sin 45°, Vx*sin 45° + Vy*cos 45°)
                tmpPoint = new Point((tmpPoint.X*Math.cos(radians))-(tmpPoint.Y*Math.sin(radians)),
                    (tmpPoint.X*Math.sin(radians))+(tmpPoint.Y*Math.cos(radians)));
                break;
        }

        if (center) {
            // translate back
            //V = (Vx,Vy) + (Ox,Oy)
            tmpPoint = new Point((tmpPoint.X+center.X),(tmpPoint.Y+center.Y),(this.Z+center.Z));
        }
        
        this.X = tmpPoint.X;
        this.Y = tmpPoint.Y;
    }

    this.MoveBy=function(pointOffset){
        this.X+=pointOffset.X;
        this.Y+=pointOffset.Y;
        this.Z+=pointOffset.Z;
    }

    this.Equals=function(point){
        if(this.X==point.X && this.Y==point.Y && this.Z==point.Z){
            return true;
        }

        return false;
    }
}

var Axis = {
    X : 0,
    Y : 1,
    Z : 2
}