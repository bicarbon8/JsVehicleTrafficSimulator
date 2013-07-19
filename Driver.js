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
function Driver(){
    this.Vehicle=null;
    this.DriverStyle=new DriverStyle().Normal;
    this.Destination=new Point(0,0);
    this.VelocityOffset=0;
    
    this.CalculateVelocityOffset=function(){
        switch(this.DriverStyle){
            case new DriverStyle().Timid:
                this.VelocityOffset=((Math.random()*10)-10); // between -10 and 0
                break;
            case new DriverStyle().Normal:
                this.VelocityOffset=((Math.random()*10)-5); // between -5 and 5
                break;
            case new DriverStyle().Aggressive:
                this.VelocityOffset=(Math.random()*10); // between 0 and 10
                break;
        }
    };
    
    this.SetDriverStyle=function(driverStyle){
        this.DriverStyle=driverStyle;
        this.CalculateVelocityOffset();
    };
    
    this.CalculateVelocityOffset();
}

function DriverStyle(){
    this.Timid=0;
    this.Normal=1;
    this.Aggressive=2;
}