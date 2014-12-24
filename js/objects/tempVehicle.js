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
JSVTS.TVEH_OPTIONS = function () {
    var self = {
        generateId: false
    };
    return self;
};
JSVTS.TempVehicle = function(options) {
    var defaults = JSVTS.TVEH_OPTIONS();
    for (var key in options) { defaults[key] = options[key]; }
    JSVTS.Vehicle.call(this, defaults);

    this.dispose(); // remove mesh as it is not needed
};
JSVTS.TempVehicle.prototype = Object.create(JSVTS.Vehicle.prototype);
JSVTS.TempVehicle.prototype.constructor = JSVTS.TempVehicle;

JSVTS.TempVehicle.prototype.copyFrom = function (vehicle) {
    if (vehicle) {
        for (var property in vehicle) {
            if (typeof vehicle[property] !== "function" && typeof vehicle[property] !== "object") {
                this[property] = vehicle[property];
            }
        }
        for (var property in vehicle.config) {
            if (typeof vehicle.config[property] !== "function" && typeof vehicle.config[property] !== "object") {
                this.config[property] = vehicle.config[property];
            }
        }
        this.id = vehicle.id;
        this.config.location = new THREE.Vector3().copy(vehicle.config.location);
    }

    return this;
};