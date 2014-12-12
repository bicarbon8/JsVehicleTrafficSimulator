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
        yellowDuration: 4,
        startState: JSVTS.StopLightState.GREEN,
        radius: 1
    };
    return self;
};
JSVTS.StopLight = function (options) {
    JSVTS.TrafficFlowControl.call(this, options);
    
    var defaults = JSVTS.STOPLIGHT_OPTIONS();
    for (var key in defaults) { this.config[key] = defaults[key]; }
    for (var key in options) { this.config[key] = options[key]; }
    
    if (this.config.changeSeconds <= 0) { throw "invalid value specified for 'changeSeconds'. values must be greater than 0."; }
    this.startState = this.config.startState;
    this.currentState = this.startState;
    this.stateElapsed = null;
};
JSVTS.StopLight.prototype = Object.create(JSVTS.TrafficFlowControl.prototype);
JSVTS.StopLight.prototype.constructor = JSVTS.StopLight;

JSVTS.StopLight.prototype.generateMesh = function () {
    if (!this.mesh) {
        // z coordinate used for vertical height
        var geometry = new THREE.SphereGeometry(this.config.radius);
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        mesh = new THREE.Mesh(geometry, material);
        this.mesh = mesh;
    }
    this.update(0);
};

JSVTS.StopLight.prototype.update = function (elapsedMs) {
    for (var i = 0; i < elapsedMs; i++) {
        this.stateElapsed++;
        switch (this.currentState) {
            case JSVTS.StopLightState.GREEN:
                if (this.stateElapsed >= this.config.changeSeconds * 1000) {
                    this.currentState = JSVTS.StopLightState.YELLOW;
                    this.stateElapsed = 0;
                }
                break;
            case JSVTS.StopLightState.YELLOW:
                if (this.stateElapsed >= this.config.yellowDuration * 1000) {
                    this.currentState = JSVTS.StopLightState.RED;
                    this.stateElapsed = 0;
                }
                break;
            case JSVTS.StopLightState.RED:
                if (this.stateElapsed >= this.config.changeSeconds * 1000) {
                    this.currentState = JSVTS.StopLightState.GREEN;
                    this.stateElapsed = 0;
                }
                break;
        }
    }

    switch (this.currentState) {
        case JSVTS.StopLightState.GREEN:
            this.mesh.material.color.setHex(0x00ff00);
            break;
        case JSVTS.StopLightState.YELLOW:
            this.mesh.material.color.setHex(0xffff00);
            break;
        case JSVTS.StopLightState.RED:
            this.mesh.material.color.setHex(0xff0000);
            break;
    }
};

JSVTS.StopLight.prototype.shouldStop = function(vehicle) {
    var distanceToV = JSVTS.Mover.GetDistanceBetweenTwoPoints(vehicle.config.location, this.config.location);
    if (distanceToV < vehicle.getLookAheadDistance() - (vehicle.config.length * 2)) {
        if (this.currentState === JSVTS.StopLightState.RED) {
            return true;
        }

        return false;
    } else {
        if (this.currentState === JSVTS.StopLightState.YELLOW || this.currentState === JSVTS.StopLightState.RED) {
            return true;
        }

        return false;
    }
};