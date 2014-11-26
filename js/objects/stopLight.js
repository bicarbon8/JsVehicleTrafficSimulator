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
function StopLight(changeSeconds,startState){
    this.InheritFrom=TrafficFlowControl;
    this.InheritFrom();

    this.Initialize=function(changeSeconds,startState) {
        this.GreenInterval=changeSeconds;
        this.YellowInterval=4;
        this.RedInterval=changeSeconds+this.YellowInterval;
        this.StartState=startState;
    }

    this.Initialize(changeSeconds,startState);
    
    this.GetState=function(elapsedSeconds){
        var state=this.StartState;
        
        var remainingSeconds=elapsedSeconds%(this.GreenInterval+this.YellowInterval+
            this.RedInterval);
        
        switch(state){
            case new StopLightState().Green:
                if(remainingSeconds>this.GreenInterval){
                    if(remainingSeconds>(this.GreenInterval+this.YellowInterval)){
                        state=new StopLightState().Red;
                    } else{
                        state=new StopLightState().Yellow;
                    }
                } else{
                    state=new StopLightState().Green;
                }
                break;
            case new StopLightState().Yellow:
                if(remainingSeconds>this.YellowInterval){
                    if(remainingSeconds>(this.YellowInterval+this.RedInterval)){
                        state=new StopLightState().Green;
                    } else{
                        state=new StopLightState().Red;
                    }
                } else{
                    state=new StopLightState().Yellow;
                }
                break;
            case new StopLightState().Red:
                if(remainingSeconds>this.RedInterval){
                    if(remainingSeconds>(this.RedInterval+this.GreenInterval)){
                        state=new StopLightState().Yellow;
                    } else{
                        state=new StopLightState().Green;
                    }
                } else{
                    state=new StopLightState().Red;
                }
                break;
        }
        
        return state;
    }
}

function StopLightState(){
    this.Green=0;
    this.Yellow=1;
    this.Red=2;
}