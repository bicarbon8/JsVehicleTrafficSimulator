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
var JSVTS = JSVTS || {};
JSVTS.StopLightState = {
    GREEN: 0,
    YELLOW: 1,
    RED: 2
};
JSVTS.STOPLIGHT_OPTIONS = function () {
    var self = {
        changeSeconds: 60,
        startState: JSVTS.StopLightState.GREEN,
        radius: 1
    };
    return self;
}
JSVTS.StopLight = function (options) {
    var self = this;
    self.inheritFrom = JSVTS.TrafficFlowControl;
    self.inheritFrom(options);
    self.mesh = null;
    self.currentState = null;

    self.init = function (options) {
        var defaults = JSVTS.STOPLIGHT_OPTIONS();
        for (var optionKey in defaults) { self.config[optionKey] = defaults[optionKey]; }
        for (var key in options) { self.config[key] = options[key]; }
        self.GreenInterval = self.config.changeSeconds;
        self.YellowInterval = 4;
        self.RedInterval = self.config.changeSeconds+self.YellowInterval;
        self.startState = self.config.startState;
        self.currentState = self.startState;
    };

    self.getState = function (elapsedMs) {
        var elapsedSeconds = elapsedMs/1000;
        var state = self.startState;
        
        var remainingSeconds = elapsedSeconds % (self.GreenInterval + self.YellowInterval + self.RedInterval);
        
        switch(state){
            case JSVTS.StopLightState.GREEN:
                if(remainingSeconds > self.GreenInterval){
                    if(remainingSeconds > (self.GreenInterval + self.YellowInterval)){
                        state = JSVTS.StopLightState.RED;
                    } else{
                        state = JSVTS.StopLightState.YELLOW;
                    }
                } else{
                    state = JSVTS.StopLightState.GREEN;
                }
                break;
            case JSVTS.StopLightState.YELLOW:
                if(remainingSeconds > self.YellowInterval){
                    if(remainingSeconds > (self.YellowInterval + self.RedInterval)){
                        state = JSVTS.StopLightState.GREEN;
                    } else{
                        state = JSVTS.StopLightState.RED;
                    }
                } else{
                    state = JSVTS.StopLightState.YELLOW;
                }
                break;
            case JSVTS.StopLightState.RED:
                if(remainingSeconds > self.RedInterval){
                    if(remainingSeconds > (self.RedInterval + self.GreenInterval)){
                        state = JSVTS.StopLightState.YELLOW;
                    } else{
                        state = JSVTS.StopLightState.GREEN;
                    }
                } else{
                    state = JSVTS.StopLightState.RED;
                }
                break;
        }
        
        return state;
    };

    self.generateMesh = function () {
        if (!self.mesh) {
            // z coordinate used for vertical height
            var geometry = new THREE.SphereGeometry(self.config.radius);
            var material = new THREE.MeshBasicMaterial({
                color: 0xffffff
            });
            mesh = new THREE.Mesh(geometry, material);
            self.mesh = mesh;
        }
        self.update(0);
    };

    self.update = function (elapsedMs) {
        self.currentState = self.getState(elapsedMs);
        switch (self.currentState) {
            case JSVTS.StopLightState.GREEN:
                self.mesh.material.color.setHex(0x00ff00);
                break;
            case JSVTS.StopLightState.YELLOW:
                self.mesh.material.color.setHex(0xffff00);
                break;
            case JSVTS.StopLightState.RED:
                self.mesh.material.color.setHex(0xff0000);
                break;
        }
    };

    self.shouldStop = function() {
        if (self.currentState === JSVTS.StopLightState.YELLOW || self.currentState === JSVTS.StopLightState.RED) {
            return true;
        }

        return false;
    }

    self.init(options);
}